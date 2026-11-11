<?php

namespace App\Services;

use App\Models\Warehouse;
use Illuminate\Support\Facades\DB;

class WarehouseService
{
    public function create(array $attributes): Warehouse
    {
        return DB::transaction(function () use ($attributes): Warehouse {
            if (($attributes['type'] ?? null) === 'main') {
                $this->demoteOtherMainWarehouses(null, $attributes['outlet_id'] ?? null);
            }

            return Warehouse::create($attributes);
        });
    }

    public function update(Warehouse $warehouse, array $attributes): void
    {
        DB::transaction(function () use ($warehouse, $attributes): void {
            if (($attributes['type'] ?? null) === 'main') {
                $this->demoteOtherMainWarehouses($warehouse->id, $warehouse->outlet_id);
            }

            $warehouse->update($attributes);
        });
    }

    private function demoteOtherMainWarehouses(?int $exceptWarehouseId, ?int $outletId): void
    {
        $query = Warehouse::query()
            ->where('type', 'main')
            ->when($exceptWarehouseId, fn ($query) => $query->where('id', '!=', $exceptWarehouseId));

        if ($outletId === null) {
            $query->whereNull('outlet_id');
        } else {
            $query->where('outlet_id', $outletId);
        }

        $query->lockForUpdate()->update(['type' => 'branch']);
    }
}
