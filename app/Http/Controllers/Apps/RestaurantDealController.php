<?php

namespace App\Http\Controllers\Apps;

use App\Http\Controllers\Controller;
use App\Models\Outlet;
use App\Models\Product;
use App\Models\RestaurantDeal;
use App\Models\RestaurantDealItem;
use App\Models\RestaurantDealSlot;
use App\Services\AuditLogService;
use App\Services\OutletAccessService;
use App\Services\RestaurantDealService;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class RestaurantDealController extends Controller
{
    public function __construct(
        private readonly AuditLogService $auditLogService,
        private readonly RestaurantDealService $dealService,
        private readonly OutletAccessService $outletAccess
    ) {}

    public function index(Request $request)
    {
        $filters = [
            'search' => $request->input('search'),
            'status' => $request->input('status'),
            'deal_type' => $request->input('deal_type'),
        ];

        $outlet = $this->outletAccess->activeOutlet($request);

        $deals = RestaurantDeal::query()
            ->with(['items.product:id,title', 'slots', 'outlet:id,name', 'creator:id,name'])
            ->when($filters['search'], function ($query, $search) {
                $query->where('name', 'like', '%'.$search.'%');
            })
            ->when($filters['status'] !== null && $filters['status'] !== '', function ($query) use ($filters) {
                match ($filters['status']) {
                    'active' => $query->where('is_active', true)
                        ->where(function ($builder) {
                            $builder->whereNull('starts_at')->orWhere('starts_at', '<=', now());
                        })
                        ->where(function ($builder) {
                            $builder->whereNull('ends_at')->orWhere('ends_at', '>=', now());
                        }),
                    'scheduled' => $query->where('is_active', true)->whereNotNull('starts_at')->where('starts_at', '>', now()),
                    'expired' => $query->whereNotNull('ends_at')->where('ends_at', '<', now()),
                    'inactive' => $query->where('is_active', false),
                    default => null,
                };
            })
            ->when($filters['deal_type'], function ($query, $dealType) {
                $query->where('deal_type', $dealType);
            })
            ->when($outlet, function ($query) use ($outlet) {
                $query->where(function ($q) use ($outlet) {
                    $q->whereNull('outlet_id')->orWhere('outlet_id', $outlet->id);
                });
            })
            ->orderByDesc('is_active')
            ->orderByDesc('priority')
            ->orderBy('name')
            ->paginate($this->perPage())
            ->withQueryString()
            ->through(fn (RestaurantDeal $deal) => [
                'id' => $deal->id,
                'name' => $deal->name,
                'description' => $deal->description,
                'deal_type' => $deal->deal_type,
                'discount_type' => $deal->discount_type,
                'discount_value' => (float) $deal->discount_value,
                'fixed_price' => $deal->fixed_price ? (float) $deal->fixed_price : null,
                'is_active' => (bool) $deal->is_active,
                'priority' => (int) $deal->priority,
                'outlet' => $deal->outlet,
                'starts_at' => optional($deal->starts_at)?->toIso8601String(),
                'ends_at' => optional($deal->ends_at)?->toIso8601String(),
                'status_label' => $deal->currentStatusLabel(),
                'items_count' => $deal->items->count(),
                'slots_count' => $deal->slots->count(),
                'created_at' => $deal->created_at?->toIso8601String(),
            ]);

        $summary = RestaurantDeal::query()
            ->when($outlet, function ($query) use ($outlet) {
                $query->where(function ($q) use ($outlet) {
                    $q->whereNull('outlet_id')->orWhere('outlet_id', $outlet->id);
                });
            })
            ->selectRaw('
                COUNT(*) as total,
                SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active_count,
                SUM(CASE WHEN is_active = 1 AND (starts_at IS NULL OR starts_at <= NOW()) AND (ends_at IS NULL OR ends_at >= NOW()) THEN 1 ELSE 0 END) as currently_active_count
            ')
            ->first();

        return Inertia::render('Dashboard/RestaurantDeals/Index', [
            'deals' => $deals,
            'filters' => $filters,
            'summary' => [
                'total' => (int) $summary->total,
                'active_count' => (int) $summary->active_count,
                'currently_active_count' => (int) $summary->currently_active_count,
            ],
        ]);
    }

    public function create(Request $request)
    {
        $outlet = $this->outletAccess->activeOutlet($request);
        $outlets = Outlet::active()->orderBy('name')->get(['id', 'name', 'code']);
        $products = Product::with('category:id,name')
            ->orderBy('title')
            ->get(['id', 'title', 'sell_price', 'category_id']);

        return Inertia::render('Dashboard/RestaurantDeals/Create', [
            'outlets' => $outlets,
            'products' => $products,
            'active_outlet' => $outlet,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'deal_type' => 'required|in:fixed_price,dynamic_price,slot_based,custom',
            'discount_type' => 'required|in:percentage,fixed_amount,fixed_price',
            'discount_value' => 'required|numeric|min:0',
            'fixed_price' => 'nullable|numeric|min:0|required_if:deal_type,fixed_price,discount_type,fixed_price',
            'is_active' => 'boolean',
            'priority' => 'integer|min:0',
            'outlet_id' => 'nullable|exists:outlets,id',
            'starts_at' => 'nullable|date',
            'ends_at' => 'nullable|date|after:starts_at',
            'max_per_customer' => 'nullable|integer|min:1',
            'min_products' => 'nullable|integer|min:1',
            'max_products' => 'nullable|integer|min:1',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.restaurant_deal_slot_id' => 'nullable|exists:restaurant_deal_slots,id',
            'items.*.is_required' => 'boolean',
            'items.*.min_qty' => 'integer|min:1',
            'items.*.max_qty' => 'integer|min:1',
            'items.*.sort_order' => 'integer|min:0',
            'slots' => 'required_if:deal_type,slot_based|array',
            'slots.*.name' => 'required|string|max:255',
            'slots.*.description' => 'nullable|string',
            'slots.*.min_selection' => 'required|integer|min:1',
            'slots.*.max_selection' => 'required|integer|min:1',
            'slots.*.sort_order' => 'integer|min:0',
        ]);

        $deal = RestaurantDeal::create([
            'name' => $validated['name'],
            'description' => $validated['description'] ?? null,
            'deal_type' => $validated['deal_type'],
            'discount_type' => $validated['discount_type'],
            'discount_value' => $validated['discount_value'],
            'fixed_price' => $validated['fixed_price'] ?? null,
            'is_active' => $validated['is_active'] ?? true,
            'priority' => $validated['priority'] ?? 0,
            'outlet_id' => $validated['outlet_id'] ?? null,
            'starts_at' => $validated['starts_at'] ?? null,
            'ends_at' => $validated['ends_at'] ?? null,
            'max_per_customer' => $validated['max_per_customer'] ?? null,
            'min_products' => $validated['min_products'] ?? null,
            'max_products' => $validated['max_products'] ?? null,
            'created_by' => auth()->id(),
        ]);

        // Create slots first (for slot-based deals)
        if ($deal->deal_type === RestaurantDeal::DEAL_TYPE_SLOT_BASED && isset($validated['slots'])) {
            foreach ($validated['slots'] as $slotData) {
                $slot = RestaurantDealSlot::create([
                    'restaurant_deal_id' => $deal->id,
                    'name' => $slotData['name'],
                    'description' => $slotData['description'] ?? null,
                    'min_selection' => $slotData['min_selection'],
                    'max_selection' => $slotData['max_selection'],
                    'sort_order' => $slotData['sort_order'] ?? 0,
                ]);

                // Map slot IDs to items
                $slotIdMap[$slotData['sort_order']] = $slot->id;
            }
        }

        // Create items
        foreach ($validated['items'] as $itemData) {
            RestaurantDealItem::create([
                'restaurant_deal_id' => $deal->id,
                'product_id' => $itemData['product_id'],
                'restaurant_deal_slot_id' => $itemData['restaurant_deal_slot_id'] ?? null,
                'is_required' => $itemData['is_required'] ?? true,
                'min_qty' => $itemData['min_qty'] ?? 1,
                'max_qty' => $itemData['max_qty'] ?? 1,
                'sort_order' => $itemData['sort_order'] ?? 0,
            ]);
        }

        $this->auditLogService->log(
            'restaurant_deal_created',
            'Restaurant Deal',
            $deal->id,
            $deal->name
        );

        return redirect()->route('restaurant-deals.index')
            ->with('success', 'Restaurant deal created successfully.');
    }

    public function edit(Request $request, RestaurantDeal $restaurantDeal)
    {
        $outlet = $this->outletAccess->activeOutlet($request);
        $outlets = Outlet::active()->orderBy('name')->get(['id', 'name', 'code']);
        $products = Product::with('category:id,name')
            ->orderBy('title')
            ->get(['id', 'title', 'sell_price', 'category_id']);

        $restaurantDeal->load(['items.product', 'slots']);

        return Inertia::render('Dashboard/RestaurantDeals/Edit', [
            'deal' => $restaurantDeal,
            'outlets' => $outlets,
            'products' => $products,
            'active_outlet' => $outlet,
        ]);
    }

    public function update(Request $request, RestaurantDeal $restaurantDeal)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'deal_type' => 'required|in:fixed_price,dynamic_price,slot_based,custom',
            'discount_type' => 'required|in:percentage,fixed_amount,fixed_price',
            'discount_value' => 'required|numeric|min:0',
            'fixed_price' => 'nullable|numeric|min:0|required_if:deal_type,fixed_price,discount_type,fixed_price',
            'is_active' => 'boolean',
            'priority' => 'integer|min:0',
            'outlet_id' => 'nullable|exists:outlets,id',
            'starts_at' => 'nullable|date',
            'ends_at' => 'nullable|date|after:starts_at',
            'max_per_customer' => 'nullable|integer|min:1',
            'min_products' => 'nullable|integer|min:1',
            'max_products' => 'nullable|integer|min:1',
            'items' => 'required|array|min:1',
            'items.*.id' => 'nullable|exists:restaurant_deal_items,id',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.restaurant_deal_slot_id' => 'nullable|exists:restaurant_deal_slots,id',
            'items.*.is_required' => 'boolean',
            'items.*.min_qty' => 'integer|min:1',
            'items.*.max_qty' => 'integer|min:1',
            'items.*.sort_order' => 'integer|min:0',
            'slots' => 'required_if:deal_type,slot_based|array',
            'slots.*.id' => 'nullable|exists:restaurant_deal_slots,id',
            'slots.*.name' => 'required|string|max:255',
            'slots.*.description' => 'nullable|string',
            'slots.*.min_selection' => 'required|integer|min:1',
            'slots.*.max_selection' => 'required|integer|min:1',
            'slots.*.sort_order' => 'integer|min:0',
        ]);

        $restaurantDeal->update([
            'name' => $validated['name'],
            'description' => $validated['description'] ?? null,
            'deal_type' => $validated['deal_type'],
            'discount_type' => $validated['discount_type'],
            'discount_value' => $validated['discount_value'],
            'fixed_price' => $validated['fixed_price'] ?? null,
            'is_active' => $validated['is_active'] ?? true,
            'priority' => $validated['priority'] ?? 0,
            'outlet_id' => $validated['outlet_id'] ?? null,
            'starts_at' => $validated['starts_at'] ?? null,
            'ends_at' => $validated['ends_at'] ?? null,
            'max_per_customer' => $validated['max_per_customer'] ?? null,
            'min_products' => $validated['min_products'] ?? null,
            'max_products' => $validated['max_products'] ?? null,
        ]);

        // Update or create slots
        if ($restaurantDeal->deal_type === RestaurantDeal::DEAL_TYPE_SLOT_BASED && isset($validated['slots'])) {
            $existingSlotIds = $restaurantDeal->slots->pluck('id')->toArray();
            $newSlotIds = [];

            foreach ($validated['slots'] as $slotData) {
                if (isset($slotData['id'])) {
                    $slot = RestaurantDealSlot::find($slotData['id']);
                    $slot->update([
                        'name' => $slotData['name'],
                        'description' => $slotData['description'] ?? null,
                        'min_selection' => $slotData['min_selection'],
                        'max_selection' => $slotData['max_selection'],
                        'sort_order' => $slotData['sort_order'] ?? 0,
                    ]);
                    $newSlotIds[] = $slot->id;
                } else {
                    $slot = RestaurantDealSlot::create([
                        'restaurant_deal_id' => $restaurantDeal->id,
                        'name' => $slotData['name'],
                        'description' => $slotData['description'] ?? null,
                        'min_selection' => $slotData['min_selection'],
                        'max_selection' => $slotData['max_selection'],
                        'sort_order' => $slotData['sort_order'] ?? 0,
                    ]);
                    $newSlotIds[] = $slot->id;
                }
            }

            // Delete removed slots
            RestaurantDealSlot::where('restaurant_deal_id', $restaurantDeal->id)
                ->whereNotIn('id', $newSlotIds)
                ->delete();
        } else {
            // Delete all slots if not slot-based
            RestaurantDealSlot::where('restaurant_deal_id', $restaurantDeal->id)->delete();
        }

        // Update or create items
        $existingItemIds = $restaurantDeal->items->pluck('id')->toArray();
        $newItemIds = [];

        foreach ($validated['items'] as $itemData) {
            if (isset($itemData['id'])) {
                $item = RestaurantDealItem::find($itemData['id']);
                $item->update([
                    'product_id' => $itemData['product_id'],
                    'restaurant_deal_slot_id' => $itemData['restaurant_deal_slot_id'] ?? null,
                    'is_required' => $itemData['is_required'] ?? true,
                    'min_qty' => $itemData['min_qty'] ?? 1,
                    'max_qty' => $itemData['max_qty'] ?? 1,
                    'sort_order' => $itemData['sort_order'] ?? 0,
                ]);
                $newItemIds[] = $item->id;
            } else {
                $item = RestaurantDealItem::create([
                    'restaurant_deal_id' => $restaurantDeal->id,
                    'product_id' => $itemData['product_id'],
                    'restaurant_deal_slot_id' => $itemData['restaurant_deal_slot_id'] ?? null,
                    'is_required' => $itemData['is_required'] ?? true,
                    'min_qty' => $itemData['min_qty'] ?? 1,
                    'max_qty' => $itemData['max_qty'] ?? 1,
                    'sort_order' => $itemData['sort_order'] ?? 0,
                ]);
                $newItemIds[] = $item->id;
            }
        }

        // Delete removed items
        RestaurantDealItem::where('restaurant_deal_id', $restaurantDeal->id)
            ->whereNotIn('id', $newItemIds)
            ->delete();

        $this->auditLogService->log(
            'restaurant_deal_updated',
            'Restaurant Deal',
            $restaurantDeal->id,
            $restaurantDeal->name
        );

        return redirect()->route('restaurant-deals.index')
            ->with('success', 'Restaurant deal updated successfully.');
    }

    public function destroy(RestaurantDeal $restaurantDeal)
    {
        $restaurantDeal->delete();

        $this->auditLogService->log(
            'restaurant_deal_deleted',
            'Restaurant Deal',
            $restaurantDeal->id,
            $restaurantDeal->name
        );

        return redirect()->route('restaurant-deals.index')
            ->with('success', 'Restaurant deal deleted successfully.');
    }
}
