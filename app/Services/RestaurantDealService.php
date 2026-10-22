<?php

namespace App\Services;

use App\Models\Outlet;
use App\Models\Product;
use App\Models\RestaurantDeal;
use App\Models\RestaurantDealItem;
use App\Models\RestaurantDealSlot;
use Carbon\CarbonInterface;
use Illuminate\Support\Collection;
use Illuminate\Validation\ValidationException;

class RestaurantDealService
{
    public function getActiveDeals(?CarbonInterface $at = null, ?Outlet $outlet = null): Collection
    {
        $at = $at ?? now();

        return RestaurantDeal::query()
            ->with([
                'items.product:id,title,sell_price,category_id',
                'slots',
            ])
            ->active()
            ->forOutlet($outlet)
            ->orderByDesc('priority')
            ->orderBy('id')
            ->get();
    }

    public function validateDealConfiguration(RestaurantDeal $deal): void
    {
        $errors = [];

        // Validate based on deal type
        match ($deal->deal_type) {
            RestaurantDeal::DEAL_TYPE_FIXED_PRICE => $this->validateFixedPriceDeal($deal, $errors),
            RestaurantDeal::DEAL_TYPE_DYNAMIC_PRICE => $this->validateDynamicPriceDeal($deal, $errors),
            RestaurantDeal::DEAL_TYPE_SLOT_BASED => $this->validateSlotBasedDeal($deal, $errors),
            RestaurantDeal::DEAL_TYPE_CUSTOM => $this->validateCustomDeal($deal, $errors),
            default => $errors[] = 'Invalid deal type.',
        };

        if (! empty($errors)) {
            throw ValidationException::withMessages([
                'deal_configuration' => implode(' ', $errors),
            ]);
        }
    }

    private function validateFixedPriceDeal(RestaurantDeal $deal, array &$errors): void
    {
        if (empty($deal->fixed_price) || $deal->fixed_price <= 0) {
            $errors[] = 'Fixed price must be greater than 0 for fixed-price deals.';
        }

        if ($deal->items->isEmpty()) {
            $errors[] = 'Fixed-price deals must have at least one product.';
        }
    }

    private function validateDynamicPriceDeal(RestaurantDeal $deal, array &$errors): void
    {
        if (empty($deal->discount_value) || $deal->discount_value <= 0) {
            $errors[] = 'Discount value must be greater than 0 for dynamic-price deals.';
        }

        if ($deal->min_products && $deal->min_products < 1) {
            $errors[] = 'Minimum products must be at least 1.';
        }

        if ($deal->max_products && $deal->max_products < $deal->min_products) {
            $errors[] = 'Maximum products must be greater than or equal to minimum products.';
        }
    }

    private function validateSlotBasedDeal(RestaurantDeal $deal, array &$errors): void
    {
        if ($deal->slots->isEmpty()) {
            $errors[] = 'Slot-based deals must have at least one slot.';
        }

        foreach ($deal->slots as $slot) {
            if ($slot->min_selection < 1) {
                $errors[] = "Slot '{$slot->name}' must have minimum selection of at least 1.";
            }

            if ($slot->max_selection < $slot->min_selection) {
                $errors[] = "Slot '{$slot->name}' maximum selection must be greater than or equal to minimum selection.";
            }

            if ($slot->items->isEmpty()) {
                $errors[] = "Slot '{$slot->name}' must have at least one product.";
            }
        }
    }

    private function validateCustomDeal(RestaurantDeal $deal, array &$errors): void
    {
        if (empty($deal->discount_value) || $deal->discount_value <= 0) {
            $errors[] = 'Discount value must be greater than 0 for custom deals.';
        }

        if ($deal->min_products && $deal->min_products < 1) {
            $errors[] = 'Minimum products must be at least 1.';
        }

        if ($deal->max_products && $deal->max_products < $deal->min_products) {
            $errors[] = 'Maximum products must be greater than or equal to minimum products.';
        }
    }

    public function calculateDealPrice(RestaurantDeal $deal, array $selectedProducts): array
    {
        $baseTotal = collect($selectedProducts)->sum(function ($item) {
            return ($item['price'] ?? 0) * ($item['qty'] ?? 1);
        });

        return match ($deal->deal_type) {
            RestaurantDeal::DEAL_TYPE_FIXED_PRICE => [
                'base_total' => $baseTotal,
                'discount_total' => max(0, $baseTotal - (int) round($deal->fixed_price * 100)),
                'final_price' => (int) round($deal->fixed_price * 100),
                'deal_type' => $deal->deal_type,
            ],
            RestaurantDeal::DEAL_TYPE_DYNAMIC_PRICE => $this->calculateDynamicPrice($deal, $baseTotal),
            RestaurantDeal::DEAL_TYPE_SLOT_BASED => $this->calculateSlotBasedPrice($deal, $selectedProducts, $baseTotal),
            RestaurantDeal::DEAL_TYPE_CUSTOM => $this->calculateDynamicPrice($deal, $baseTotal),
            default => [
                'base_total' => $baseTotal,
                'discount_total' => 0,
                'final_price' => $baseTotal,
                'deal_type' => $deal->deal_type,
            ],
        };
    }

    private function calculateDynamicPrice(RestaurantDeal $deal, int $baseTotal): array
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
            'deal_type' => $deal->deal_type,
        ];
    }

    private function calculateSlotBasedPrice(RestaurantDeal $deal, array $selectedProducts, int $baseTotal): array
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
            'deal_type' => $deal->deal_type,
        ];
    }

    public function validateSlotSelection(RestaurantDeal $deal, array $selectedProducts): void
    {
        if ($deal->deal_type !== RestaurantDeal::DEAL_TYPE_SLOT_BASED) {
            return;
        }

        $slotSelections = collect($selectedProducts)
            ->groupBy('restaurant_deal_slot_id')
            ->map(fn ($items) => $items->sum('qty'));

        foreach ($deal->slots as $slot) {
            $selectedQty = $slotSelections->get($slot->id, 0);

            if ($selectedQty < $slot->min_selection) {
                throw ValidationException::withMessages([
                    'slot_selection' => "Slot '{$slot->name}' requires at least {$slot->min_selection} item(s). Selected: {$selectedQty}.",
                ]);
            }

            if ($selectedQty > $slot->max_selection) {
                throw ValidationException::withMessages([
                    'slot_selection' => "Slot '{$slot->name}' allows maximum {$slot->max_selection} item(s). Selected: {$selectedQty}.",
                ]);
            }
        }
    }

    public function getDealComponents(RestaurantDeal $deal): Collection
    {
        return $deal->items()->with('product')->get();
    }
}
