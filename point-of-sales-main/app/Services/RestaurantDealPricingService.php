<?php

namespace App\Services;

use App\Models\Cart;
use App\Models\Outlet;
use App\Models\RestaurantDeal;
use Carbon\CarbonInterface;
use Illuminate\Support\Collection;

class RestaurantDealPricingService
{
    public function __construct(
        private readonly RestaurantDealService $dealService
    ) {}

    public function previewDealsInCart(iterable $carts, ?Outlet $outlet = null, ?CarbonInterface $at = null): array
    {
        $cartCollection = collect($carts)
            ->filter(fn ($cart) => $cart instanceof Cart && $cart->product)
            ->values();

        $deals = $this->dealService->getActiveDeals($at, $outlet);

        $dealApplications = [];

        foreach ($deals as $deal) {
            $applicableItems = $this->findApplicableItems($deal, $cartCollection);

            if (! empty($applicableItems)) {
                $dealApplications[] = [
                    'deal' => $this->serializeDeal($deal),
                    'applicable_items' => $applicableItems,
                    'pricing' => $this->calculateDealApplication($deal, $applicableItems),
                ];
            }
        }

        return [
            'deals' => $dealApplications,
            'total_deal_discount' => collect($dealApplications)->sum('pricing.discount_total'),
        ];
    }

    private function findApplicableItems(RestaurantDeal $deal, Collection $carts): array
    {
        $applicableItems = [];

        match ($deal->deal_type) {
            RestaurantDeal::DEAL_TYPE_FIXED_PRICE => $applicableItems = $this->findFixedPriceItems($deal, $carts),
            RestaurantDeal::DEAL_TYPE_DYNAMIC_PRICE => $applicableItems = $this->findDynamicPriceItems($deal, $carts),
            RestaurantDeal::DEAL_TYPE_SLOT_BASED => $applicableItems = $this->findSlotBasedItems($deal, $carts),
            RestaurantDeal::DEAL_TYPE_CUSTOM => $applicableItems = $this->findCustomItems($deal, $carts),
            default => $applicableItems = [],
        };

        return $applicableItems;
    }

    private function findFixedPriceItems(RestaurantDeal $deal, Collection $carts): array
    {
        $dealProductIds = $deal->items->pluck('product_id')->toArray();
        $matchedItems = [];

        foreach ($carts as $cart) {
            if (in_array($cart->product_id, $dealProductIds)) {
                $matchedItems[] = [
                    'cart_id' => $cart->id,
                    'product_id' => $cart->product_id,
                    'qty' => $cart->qty,
                    'price' => $cart->price,
                ];
            }
        }

        return $matchedItems;
    }

    private function findDynamicPriceItems(RestaurantDeal $deal, Collection $carts): array
    {
        $minProducts = $deal->min_products ?? 1;
        $maxProducts = $deal->max_products ?? count($carts);

        $eligibleCarts = $carts->take($maxProducts);

        if (count($eligibleCarts) < $minProducts) {
            return [];
        }

        return $eligibleCarts->map(fn ($cart) => [
            'cart_id' => $cart->id,
            'product_id' => $cart->product_id,
            'qty' => $cart->qty,
            'price' => $cart->price,
        ])->toArray();
    }

    private function findSlotBasedItems(RestaurantDeal $deal, Collection $carts): array
    {
        $matchedItems = [];

        foreach ($deal->slots as $slot) {
            $slotProductIds = $slot->items->pluck('product_id')->toArray();
            $minSelection = $slot->min_selection;
            $maxSelection = $slot->max_selection;

            $slotCarts = $carts->filter(fn ($cart) => in_array($cart->product_id, $slotProductIds));
            $selectedCarts = $slotCarts->take($maxSelection);

            if (count($selectedCarts) < $minSelection) {
                return [];
            }

            foreach ($selectedCarts as $cart) {
                $matchedItems[] = [
                    'cart_id' => $cart->id,
                    'product_id' => $cart->product_id,
                    'qty' => $cart->qty,
                    'price' => $cart->price,
                    'restaurant_deal_slot_id' => $slot->id,
                ];
            }
        }

        return $matchedItems;
    }

    private function findCustomItems(RestaurantDeal $deal, Collection $carts): array
    {
        $minProducts = $deal->min_products ?? 1;
        $maxProducts = $deal->max_products ?? count($carts);

        $eligibleCarts = $carts->take($maxProducts);

        if (count($eligibleCarts) < $minProducts) {
            return [];
        }

        return $eligibleCarts->map(fn ($cart) => [
            'cart_id' => $cart->id,
            'product_id' => $cart->product_id,
            'qty' => $cart->qty,
            'price' => $cart->price,
        ])->toArray();
    }

    private function calculateDealApplication(RestaurantDeal $deal, array $items): array
    {
        $baseTotal = collect($items)->sum(fn ($item) => $item['price'] * $item['qty']);

        return match ($deal->deal_type) {
            RestaurantDeal::DEAL_TYPE_FIXED_PRICE => [
                'base_total' => $baseTotal,
                'discount_total' => max(0, $baseTotal - (int) round($deal->fixed_price * 100)),
                'final_price' => (int) round($deal->fixed_price * 100),
            ],
            RestaurantDeal::DEAL_TYPE_DYNAMIC_PRICE, RestaurantDeal::DEAL_TYPE_CUSTOM => $this->calculateDynamicDiscount($deal, $baseTotal),
            RestaurantDeal::DEAL_TYPE_SLOT_BASED => $this->calculateSlotDiscount($deal, $baseTotal),
            default => [
                'base_total' => $baseTotal,
                'discount_total' => 0,
                'final_price' => $baseTotal,
            ],
        };
    }

    private function calculateDynamicDiscount(RestaurantDeal $deal, int $baseTotal): array
    {
        $discountTotal = match ($deal->discount_type) {
            RestaurantDeal::DISCOUNT_TYPE_PERCENTAGE => (int) round($baseTotal * $deal->discount_value / 100),
            RestaurantDeal::DISCOUNT_TYPE_FIXED_AMOUNT => (int) round($deal->discount_value * 100),
            default => 0,
        };

        return [
            'base_total' => $baseTotal,
            'discount_total' => $discountTotal,
            'final_price' => max(0, $baseTotal - $discountTotal),
        ];
    }

    private function calculateSlotDiscount(RestaurantDeal $deal, int $baseTotal): array
    {
        $discountTotal = match ($deal->discount_type) {
            RestaurantDeal::DISCOUNT_TYPE_PERCENTAGE => (int) round($baseTotal * $deal->discount_value / 100),
            RestaurantDeal::DISCOUNT_TYPE_FIXED_AMOUNT => (int) round($deal->discount_value * 100),
            RestaurantDeal::DISCOUNT_TYPE_FIXED_PRICE => max(0, $baseTotal - (int) round($deal->fixed_price * 100)),
            default => 0,
        };

        return [
            'base_total' => $baseTotal,
            'discount_total' => $discountTotal,
            'final_price' => max(0, $baseTotal - $discountTotal),
        ];
    }

    private function serializeDeal(RestaurantDeal $deal): array
    {
        return [
            'id' => $deal->id,
            'name' => $deal->name,
            'description' => $deal->description,
            'deal_type' => $deal->deal_type,
            'discount_type' => $deal->discount_type,
            'discount_value' => $deal->discount_value,
            'fixed_price' => $deal->fixed_price,
            'priority' => $deal->priority,
        ];
    }
}
