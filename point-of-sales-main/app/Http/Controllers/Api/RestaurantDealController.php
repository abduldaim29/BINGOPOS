<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Outlet;
use App\Models\RestaurantDeal;
use App\Services\RestaurantDealService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class RestaurantDealController extends Controller
{
    public function __construct(
        private readonly RestaurantDealService $dealService
    ) {}

    public function index(Request $request): JsonResponse
    {
        $outletId = $request->input('outlet_id');
        $outlet = $outletId ? Outlet::find($outletId) : null;

        $deals = $this->dealService->getActiveDeals(null, $outlet);

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
                'slots' => $deal->slots->map(fn ($slot) => [
                    'id' => $slot->id,
                    'name' => $slot->name,
                    'description' => $slot->description,
                    'min_selection' => $slot->min_selection,
                    'max_selection' => $slot->max_selection,
                    'products' => $slot->items->map(fn ($item) => [
                        'product_id' => $item->product_id,
                        'min_qty' => $item->min_qty,
                        'max_qty' => $item->max_qty,
                    ]),
                ]),
                'items' => $deal->items->map(fn ($item) => [
                    'product_id' => $item->product_id,
                    'product' => $item->product,
                    'is_required' => $item->is_required,
                    'min_qty' => $item->min_qty,
                    'max_qty' => $item->max_qty,
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
                    ]),
                ]),
                'items' => $restaurantDeal->items->map(fn ($item) => [
                    'product_id' => $item->product_id,
                    'product' => $item->product,
                    'is_required' => $item->is_required,
                    'min_qty' => $item->min_qty,
                    'max_qty' => $item->max_qty,
                ]),
            ],
        ]);
    }
}
