<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\RestaurantDeal;
use App\Models\RestaurantDealItem;
use App\Services\OutletAccessService;
use App\Services\RestaurantDealService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class RestaurantDealController extends Controller
{
    public function __construct(
        private readonly RestaurantDealService $dealService,
        private readonly OutletAccessService $outletAccess
    ) {}

    public function index(Request $request): JsonResponse
    {
        $outlet = $this->outletAccess->activeOutlet($request);
        $deals = $this->dealService->getActiveDeals(null, $outlet);
        $deals->load(['items.product', 'slots.items.product']);

        return response()->json([
            'data' => $deals->map(fn ($deal) => [
                'id' => $deal->id,
                'name' => $deal->name,
                'description' => $deal->description,
                'deal_type' => $deal->deal_type,
                'discount_type' => $deal->discount_type,
                'discount_value' => (float) $deal->discount_value,
                'fixed_price' => $deal->fixed_price ? (float) $deal->fixed_price : null,
                'min_products' => $deal->min_products,
                'max_products' => $deal->max_products,
                'outlet_id' => $deal->outlet_id,
                'is_active' => $deal->is_active,
                'slots' => $deal->slots->map(fn ($slot) => [
                    'id' => $slot->id,
                    'name' => $slot->name,
                    'description' => $slot->description,
                    'min_selection' => $slot->min_selection,
                    'max_selection' => $slot->max_selection,
                    'products' => $slot->items->map(fn ($item) => [
                        'product_id' => $item->product_id,
                        'product' => $item->product,
                        'min_qty' => $item->min_qty,
                        'max_qty' => $item->max_qty,
                        ...$this->variationFields($item),
                    ]),
                ]),
                'items' => $deal->items->map(fn ($item) => [
                    'product_id' => $item->product_id,
                    'product' => $item->product,
                    'restaurant_deal_slot_id' => $item->restaurant_deal_slot_id,
                    'is_required' => $item->is_required,
                    'min_qty' => $item->min_qty,
                    'max_qty' => $item->max_qty,
                    'deal_price' => $item->deal_price !== null ? (float) $item->deal_price : null,
                    ...$this->variationFields($item),
                ]),
            ]),
        ]);
    }

    public function show(RestaurantDeal $restaurantDeal): JsonResponse
    {
        $restaurantDeal->load(['items.product', 'slots.items.product']);

        return response()->json([
            'data' => [
                'id' => $restaurantDeal->id,
                'name' => $restaurantDeal->name,
                'description' => $restaurantDeal->description,
                'deal_type' => $restaurantDeal->deal_type,
                'discount_type' => $restaurantDeal->discount_type,
                'discount_value' => (float) $restaurantDeal->discount_value,
                'fixed_price' => $restaurantDeal->fixed_price ? (float) $restaurantDeal->fixed_price : null,
                'min_products' => $restaurantDeal->min_products,
                'max_products' => $restaurantDeal->max_products,
                'outlet_id' => $restaurantDeal->outlet_id,
                'slots' => $restaurantDeal->slots->map(fn ($slot) => [
                    'id' => $slot->id,
                    'name' => $slot->name,
                    'description' => $slot->description,
                    'min_selection' => $slot->min_selection,
                    'max_selection' => $slot->max_selection,
                    'products' => $slot->items->map(fn ($item) => [
                        'product_id' => $item->product_id,
                        'product' => $item->product,
                        'min_qty' => $item->min_qty,
                        'max_qty' => $item->max_qty,
                        ...$this->variationFields($item),
                    ]),
                ]),
                'items' => $restaurantDeal->items->map(fn ($item) => [
                    'product_id' => $item->product_id,
                    'product' => $item->product,
                    'restaurant_deal_slot_id' => $item->restaurant_deal_slot_id,
                    'is_required' => $item->is_required,
                    'min_qty' => $item->min_qty,
                    'max_qty' => $item->max_qty,
                    'deal_price' => $item->deal_price !== null ? (float) $item->deal_price : null,
                    ...$this->variationFields($item),
                ]),
            ],
        ]);
    }

    private function variationFields(RestaurantDealItem $item): array
    {
        $variationData = $item->deal_variation_prices ?? [];
        $selectedVariationId = $variationData['__selected_variation_id'] ?? null;
        unset($variationData['__selected_variation_id']);

        return [
            'selected_variation_id' => $selectedVariationId,
            'deal_variation_prices' => $variationData,
        ];
    }
}
