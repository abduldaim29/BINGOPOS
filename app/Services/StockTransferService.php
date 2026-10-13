<?php

namespace App\Services;

use App\Models\ProductWarehouse;
use App\Models\StockMutation;
use App\Models\StockTransfer;
use App\Models\StockTransferItem;
use App\Models\User;
use App\Models\Warehouse;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class StockTransferService
{
    public function __construct(
        private readonly AuditLogService $auditLogService,
        private readonly OutletAccessService $outletAccessService
    ) {}

    public function generateDocumentNumber(): string
    {
        $prefix = 'ST-'.now()->format('Ymd').'-';
        $last = StockTransfer::where('document_number', 'like', $prefix.'%')
            ->orderByDesc('document_number')
            ->value('document_number');

        $next = $last ? (int) Str::afterLast($last, '-') + 1 : 1;

        return $prefix.str_pad((string) $next, 4, '0', STR_PAD_LEFT);
    }

    public function createDraft(array $data, array $items, int $userId): StockTransfer
    {
        $this->ensureWarehouseAccess($userId, $data['source_warehouse_id']);
        $this->ensureWarehouseAccess($userId, $data['destination_warehouse_id']);

        if ($data['source_warehouse_id'] === $data['destination_warehouse_id']) {
            throw ValidationException::withMessages([
                'destination_warehouse_id' => 'The source and destination warehouses must be different.',
            ]);
        }

        // Potential retry: retry only on document_number unique collisions (concurrent drafts may generate the same next number).
        return retry(3, function () use ($data, $items, $userId) {
            return DB::transaction(function () use ($data, $items, $userId) {
                $transfer = StockTransfer::create([
                    'source_warehouse_id' => $data['source_warehouse_id'],
                    'destination_warehouse_id' => $data['destination_warehouse_id'],
                    'document_number' => $data['document_number'] ?? $this->generateDocumentNumber(),
                    'status' => 'draft',
                    'notes' => $data['notes'] ?? null,
                    'created_by' => $userId,
                ]);

                foreach ($items as $item) {
                    StockTransferItem::create([
                        'stock_transfer_id' => $transfer->id,
                        'product_id' => $item['product_id'],
                        'qty' => $item['qty'],
                    ]);
                }

                $this->auditLogService->log(
                    event: 'stock_transfer.created',
                    module: 'stock',
                    auditable: $transfer,
                    description: 'Stock transfer '.$transfer->document_number.' created.',
                    after: [
                        'document_number' => $transfer->document_number,
                        'source_warehouse_id' => $transfer->source_warehouse_id,
                        'destination_warehouse_id' => $transfer->destination_warehouse_id,
                        'status' => 'draft',
                        'total_items' => count($items),
                    ],
                    meta: ['stock_transfer_id' => $transfer->id],
                );

                return $transfer;
            });
        }, 0, function ($e) {
            return $e instanceof QueryException && str_contains($e->getMessage(), 'document_number');
        });
    }

    public function send(StockTransfer $transfer, int $userId): void
    {
        DB::transaction(function () use ($transfer, $userId) {
            // Lock the transfer row and re-check status inside the transaction (prevents double-send and send-after-cancel races).
            $transfer = StockTransfer::whereKey($transfer->id)->lockForUpdate()->firstOrFail();
            $this->ensureWarehouseAccess($userId, $transfer->source_warehouse_id);

            if (! $transfer->isDraft()) {
                throw ValidationException::withMessages([
                    'transfer' => 'Only transfers with draft status can be sent.',
                ]);
            }

            $transfer->load('items.product');
            $before = $transfer->replicate();

            // Validate stock availability and decrement source warehouse stock (locked rows).
            foreach ($transfer->items as $item) {
                $pw = ProductWarehouse::where([
                    'product_id' => $item->product_id,
                    'warehouse_id' => $transfer->source_warehouse_id,
                ])->lockForUpdate()->first();

                $available = $pw ? (int) $pw->stock : 0;
                if ($available < $item->qty) {
                    throw ValidationException::withMessages([
                        'transfer' => "Insufficient stock for {$item->product->title} in the source warehouse (available: {$available}).",
                    ]);
                }

                $stockAfter = $available - $item->qty;
                if ($pw) {
                    $pw->decrement('stock', $item->qty);
                }
                $item->product->decrement('stock', $item->qty);

                StockMutation::create([
                    'product_id' => $item->product_id,
                    'warehouse_id' => $transfer->source_warehouse_id,
                    'reference_type' => 'stock_transfer',
                    'reference_id' => $transfer->id,
                    'mutation_type' => 'out',
                    'qty' => $item->qty,
                    'stock_before' => $available,
                    'stock_after' => $stockAfter,
                    'notes' => 'Transfer to '.$transfer->destinationWarehouse->code,
                    'created_by' => $userId,
                ]);
            }

            $transfer->update([
                'status' => 'in_transit',
            ]);

            $this->auditLogService->log(
                event: 'stock_transfer.sent',
                module: 'stock',
                auditable: $transfer,
                description: 'Stock transfer '.$transfer->document_number.' sent.',
                before: ['status' => $before->status],
                after: ['status' => 'in_transit'],
                meta: ['stock_transfer_id' => $transfer->id],
            );
        });
    }

    public function receive(StockTransfer $transfer, int $userId): void
    {
        DB::transaction(function () use ($transfer, $userId) {
            // Lock the transfer row and re-check status inside the transaction (prevents duplicate receipt).
            $transfer = StockTransfer::whereKey($transfer->id)->lockForUpdate()->firstOrFail();
            $this->ensureWarehouseAccess($userId, $transfer->destination_warehouse_id);

            if (! $transfer->isInTransit()) {
                throw ValidationException::withMessages([
                    'transfer' => 'Only transfers with in_transit status can be received.',
                ]);
            }

            $transfer->load('items.product');
            $before = $transfer->replicate();

            // Increment destination warehouse stock and legacy stock.
            foreach ($transfer->items as $item) {
                $product = $item->product;
                $stockBefore = (int) $product->stock;

                // Use firstOrCreate (NOT updateOrCreate with stock=0, which would reset an existing row).
                ProductWarehouse::firstOrCreate(
                    ['product_id' => $item->product_id, 'warehouse_id' => $transfer->destination_warehouse_id],
                    ['stock' => 0]
                )->increment('stock', $item->qty);

                $product->increment('stock', $item->qty);

                StockMutation::create([
                    'product_id' => $product->id,
                    'warehouse_id' => $transfer->destination_warehouse_id,
                    'reference_type' => 'stock_transfer',
                    'reference_id' => $transfer->id,
                    'mutation_type' => 'in',
                    'qty' => $item->qty,
                    'stock_before' => $stockBefore,
                    'stock_after' => (int) $product->stock,
                    'notes' => 'Transfer from '.$transfer->sourceWarehouse->code,
                    'created_by' => $userId,
                ]);
            }

            $transfer->update([
                'status' => 'completed',
                'completed_at' => now(),
            ]);

            $this->auditLogService->log(
                event: 'stock_transfer.received',
                module: 'stock',
                auditable: $transfer,
                description: 'Stock transfer '.$transfer->document_number.' received.',
                before: ['status' => $before->status],
                after: ['status' => 'completed'],
                meta: ['stock_transfer_id' => $transfer->id],
            );
        });
    }

    public function cancel(StockTransfer $transfer, int $userId): void
    {
        DB::transaction(function () use ($transfer, $userId) {
            // Lock the transfer row and re-check status inside the transaction (prevents cancellation after completion).
            $transfer = StockTransfer::whereKey($transfer->id)->lockForUpdate()->firstOrFail();
            $this->ensureWarehouseAccess($userId, $transfer->source_warehouse_id);

            if (! in_array($transfer->status, ['draft', 'in_transit'])) {
                throw ValidationException::withMessages([
                    'transfer' => 'Only draft or in-transit transfers can be cancelled.',
                ]);
            }

            $before = $transfer->replicate();
            $returnStock = $transfer->isInTransit();

            // If sent but not received, return stock to the source warehouse.
            if ($returnStock) {
                $transfer->load('items.product');

                foreach ($transfer->items as $item) {
                    $product = $item->product;

                    // Use firstOrCreate (NOT updateOrCreate with stock=0, which would reset an existing row).
                    ProductWarehouse::firstOrCreate(
                        ['product_id' => $item->product_id, 'warehouse_id' => $transfer->source_warehouse_id],
                        ['stock' => 0]
                    )->increment('stock', $item->qty);

                    $product->increment('stock', $item->qty);
                }
            }

            $transfer->update(['status' => 'cancelled']);

            $this->auditLogService->log(
                event: 'stock_transfer.cancelled',
                module: 'stock',
                auditable: $transfer,
                description: 'Stock transfer '.$transfer->document_number.' cancelled.'.($returnStock ? ' Stock returned to the source warehouse.' : ''),
                before: ['status' => $before->status],
                after: ['status' => 'cancelled'],
                meta: ['stock_transfer_id' => $transfer->id],
            );
        });
    }

    private function ensureWarehouseAccess(int $userId, int $warehouseId): void
    {
        $user = User::findOrFail($userId);
        $warehouse = Warehouse::findOrFail($warehouseId);

        abort_unless($this->outletAccessService->canUseWarehouse($user, $warehouse), 403);
    }
}