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
    private const SELECTED_VARIATION_KEY = '__selected_variation_id';

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
            ->orderByDesc('id')
            ->orderByDesc('is_active')
            ->orderByDesc('priority')
            ->orderBy('name')
            ->paginate(15)
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
            ->get(['id', 'title', 'sell_price', 'category_id', 'variations', 'variation_prices']);
        $products->each(function (Product $product) {
            $product->setAttribute(
                'variations',
                $this->normalizeVariationIds($product->variations ?? [])
            );
        });

        return Inertia::render('Dashboard/RestaurantDeals/Create', [
            'outlets' => $outlets,
            'products' => $products,
            'active_outlet' => $outlet,
        ]);
    }

    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'deal_type' => 'required|in:fixed_price,dynamic_price,slot_based,custom',
            'discount_type' => 'nullable|in:percentage,fixed_amount,fixed_price',
            'discount_value' => 'nullable|numeric|min:0|required_if:deal_type,dynamic_price',
            'fixed_price' => 'nullable|numeric|min:0|required_if:deal_type,fixed_price,discount_type,fixed_price',
            'is_active' => 'required|boolean',
            'priority' => 'required|integer|min:0',
            'outlet_id' => 'nullable|exists:outlets,id',
            'starts_at' => 'nullable|date',
            'ends_at' => 'nullable|date',
            'max_per_customer' => 'nullable|integer|min:1',
            'min_products' => 'nullable|integer|min:1',
            'max_products' => 'nullable|integer|min:1',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.restaurant_deal_slot_id' => 'nullable|exists:restaurant_deal_slots,id',
            'items.*.is_required' => 'boolean',
            'items.*.min_qty' => 'required|integer|min:1',
            'items.*.max_qty' => 'required|integer|min:1',
            'items.*.sort_order' => 'required|integer|min:0',
            'items.*.deal_price' => 'nullable|numeric|min:0',
            'items.*.deal_variation_prices' => 'nullable|array',
            'items.*.deal_variation_prices.*' => 'nullable|numeric|min:0',
            'items.*.selected_variation_id' => 'nullable|string|max:100',
            'slots' => 'required_if:deal_type,slot_based|array',
            'slots.*.name' => 'required|string|max:255',
            'slots.*.description' => 'nullable|string',
            'slots.*.min_selection' => 'required|integer|min:1',
            'slots.*.max_selection' => 'required|integer|min:1',
            'slots.*.sort_order' => 'required|integer|min:0',
        ], [
            'items.required' => 'At least one product must be added to the deal.',
            'items.*.product_id.required' => 'Please select a product for each item.',
        ]);

        $this->validateSelectedVariations($validated['items']);

        $deal = RestaurantDeal::create([
            'name' => $validated['name'],
            'description' => $validated['description'] ?? null,
            'deal_type' => $validated['deal_type'],
            'discount_type' => $validated['discount_type'] ?? ($validated['deal_type'] === 'fixed_price' ? 'fixed_price' : null),
            'discount_value' => $validated['discount_value'] ?? 0,
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
        $slotIdMap = [];
        if ($deal->deal_type === RestaurantDeal::DEAL_TYPE_SLOT_BASED && isset($validated['slots']) && is_array($validated['slots'])) {
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
            $dealItem = RestaurantDealItem::create([
                'restaurant_deal_id' => $deal->id,
                'product_id' => $itemData['product_id'],
                'restaurant_deal_slot_id' => $itemData['restaurant_deal_slot_id'] ?? null,
                'is_required' => $itemData['is_required'] ?? true,
                'min_qty' => $itemData['min_qty'] ?? 1,
                'max_qty' => $itemData['max_qty'] ?? 1,
                'sort_order' => $itemData['sort_order'] ?? 0,
                'deal_price' => $itemData['deal_price'] ?? null,
                'deal_variation_prices' => $this->variationDataForItem($itemData),
            ]);
        }

        $this->auditLogService->log(
            'restaurant_deal_created',
            'Restaurant Deal',
            $deal,
            $deal->name
        );

        return redirect()->route('restaurant-deals.index')
            ->with('success', 'Restaurant deal created successfully.');
        } catch (\Exception $e) {
            if ($e instanceof \Illuminate\Validation\ValidationException) {
                throw $e;
            }

            \Log::error('RestaurantDeal store failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'request_data' => $request->all(),
            ]);
            return redirect()->back()
                ->withInput()
                ->with('error', 'Failed to create restaurant deal: ' . $e->getMessage());
        }
    }

    public function edit(Request $request, RestaurantDeal $restaurantDeal)
    {
        $outlet = $this->outletAccess->activeOutlet($request);
        $outlets = Outlet::active()->orderBy('name')->get(['id', 'name', 'code']);
        $products = Product::with('category:id,name')
            ->orderBy('title')
            ->get(['id', 'title', 'sell_price', 'category_id', 'variations', 'variation_prices']);
        $products->each(function (Product $product) {
            $product->setAttribute(
                'variations',
                $this->normalizeVariationIds($product->variations ?? [])
            );
        });

        $restaurantDeal->load(['items.product', 'slots']);
        foreach ($restaurantDeal->items as $item) {
            $variationData = $item->deal_variation_prices ?? [];
            $item->setAttribute(
                'selected_variation_id',
                $variationData[self::SELECTED_VARIATION_KEY] ?? null
            );
            unset($variationData[self::SELECTED_VARIATION_KEY]);
            $item->setAttribute('deal_variation_prices', $variationData);
        }

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
            'discount_type' => 'nullable|in:percentage,fixed_amount,fixed_price',
            'discount_value' => 'nullable|numeric|min:0|required_if:deal_type,dynamic_price',
            'fixed_price' => 'nullable|numeric|min:0|required_if:deal_type,fixed_price,discount_type,fixed_price',
            'is_active' => 'required|boolean',
            'priority' => 'required|integer|min:0',
            'outlet_id' => 'nullable|exists:outlets,id',
            'starts_at' => 'nullable|date',
            'ends_at' => 'nullable|date',
            'max_per_customer' => 'nullable|integer|min:1',
            'min_products' => 'nullable|integer|min:1',
            'max_products' => 'nullable|integer|min:1',
            'items' => 'required|array|min:1',
            'items.*.id' => 'nullable|exists:restaurant_deal_items,id',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.restaurant_deal_slot_id' => 'nullable|exists:restaurant_deal_slots,id',
            'items.*.is_required' => 'boolean',
            'items.*.min_qty' => 'required|integer|min:1',
            'items.*.max_qty' => 'required|integer|min:1',
            'items.*.sort_order' => 'required|integer|min:0',
            'items.*.deal_price' => 'nullable|numeric|min:0',
            'items.*.deal_variation_prices' => 'nullable|array',
            'items.*.deal_variation_prices.*' => 'nullable|numeric|min:0',
            'items.*.selected_variation_id' => 'nullable|string|max:100',
            'slots' => 'required_if:deal_type,slot_based|array',
            'slots.*.id' => 'nullable|exists:restaurant_deal_slots,id',
            'slots.*.name' => 'required|string|max:255',
            'slots.*.description' => 'nullable|string',
            'slots.*.min_selection' => 'required|integer|min:1',
            'slots.*.max_selection' => 'required|integer|min:1',
            'slots.*.sort_order' => 'integer|min:0',
        ]);

        $this->validateSelectedVariations($validated['items']);

        $restaurantDeal->update([
            'name' => $validated['name'],
            'description' => $validated['description'] ?? null,
            'deal_type' => $validated['deal_type'],
            'discount_type' => $validated['discount_type'] ?? ($validated['deal_type'] === 'fixed_price' ? 'fixed_price' : null),
            'discount_value' => $validated['discount_value'] ?? 0,
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
                    'deal_price' => $itemData['deal_price'] ?? null,
                    'deal_variation_prices' => $this->variationDataForItem($itemData),
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
                    'deal_price' => $itemData['deal_price'] ?? null,
                    'deal_variation_prices' => $this->variationDataForItem($itemData),
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
            $restaurantDeal,
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
            $restaurantDeal,
            $restaurantDeal->name
        );

        return redirect()->route('restaurant-deals.index')
            ->with('success', 'Restaurant deal deleted successfully.');
    }

    private function validateSelectedVariations(array $items): void
    {
        $products = Product::query()
            ->whereIn('id', collect($items)->pluck('product_id')->unique())
            ->get(['id', 'variations'])
            ->keyBy('id');
        $errors = [];

        foreach ($items as $index => $item) {
            $product = $products->get((int) $item['product_id']);
            $variations = $this->normalizeVariationIds($product?->variations ?? []);
            $selectedVariationId = $item['selected_variation_id'] ?? null;

            if ($variations !== [] && ! in_array((string) $selectedVariationId, $variations, true)) {
                $errors["items.{$index}.selected_variation_id"] = 'Select an available variation for this product.';
            } elseif ($variations === [] && $selectedVariationId) {
                $errors["items.{$index}.selected_variation_id"] = 'This product does not have variations.';
            }

            foreach ($item['deal_variation_prices'] ?? [] as $variationId => $price) {
                if (! in_array((string) $variationId, $variations, true)) {
                    $errors["items.{$index}.deal_variation_prices.{$variationId}"] = 'A price was provided for an unavailable product variation.';
                }
            }
        }

        if ($errors !== []) {
            throw \Illuminate\Validation\ValidationException::withMessages($errors);
        }
    }

    private function normalizeVariationIds(array $variations): array
    {
        $variationIds = [];

        foreach ($variations as $category => $options) {
            if (is_array($options)) {
                foreach ($options as $option) {
                    if (! is_string($option) && ! is_numeric($option)) {
                        continue;
                    }

                    $option = (string) $option;
                    $variationIds[] = str_starts_with($option, "{$category}_")
                        ? $option
                        : "{$category}_{$option}";
                }

                continue;
            }

            if (is_string($options) || is_numeric($options)) {
                $variationIds[] = (string) $options;
            }
        }

        return array_values(array_unique($variationIds));
    }

    private function variationDataForItem(array $itemData): ?array
    {
        $variationData = $itemData['deal_variation_prices'] ?? [];
        $selectedVariationId = $itemData['selected_variation_id'] ?? null;

        if ($selectedVariationId) {
            $variationData[self::SELECTED_VARIATION_KEY] = (string) $selectedVariationId;
        } else {
            unset($variationData[self::SELECTED_VARIATION_KEY]);
        }

        return $variationData !== [] ? $variationData : null;
    }
}
