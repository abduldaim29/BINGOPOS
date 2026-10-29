<?php

namespace App\Services;

use App\Models\Customer;
use App\Models\Outlet;
use App\Models\PriceList;
use App\Models\Product;
use Illuminate\Database\Eloquent\Collection as EloquentCollection;

class PriceListService
{
    /**
     * Cache price lists and customer-specific selection for repeated
     * product pricing within the same service instance.
     */
    private array $priceListsByOutlet = [];

    private array $applicableLists = [];

    private array $segmentMembership = [];

    public function getApplicablePriceList(
        ?Customer $customer,
        ?Outlet $outlet = null
    ): ?PriceList {
        $customerId = $customer?->getKey() ?? 0;
        $outletId = $outlet?->getKey() ?? 0;
        $isMember = (bool) ($customer?->is_loyalty_member ?? false);

        $cacheKey = implode(':', [
            $outletId,
            $customerId,
            (int) $isMember,
        ]);

        if (array_key_exists($cacheKey, $this->applicableLists)) {
            return $this->applicableLists[$cacheKey];
        }

        $lists = $this->getPriceListsForOutlet($outletId);

        foreach ($lists as $list) {
            $matches = match ($list->customer_scope) {
                'all' => true,
                'walk_in' => $customer === null || (bool) $customer->is_walkin,
                'registered' => $customer !== null && ! $customer->is_walkin,
                'member' => $customer !== null && ! $customer->is_walkin && $isMember,
                'segment' => $customer !== null && ! $customer->is_walkin
                    && $list->customer_segment_id !== null
                    && $this->customerBelongsToSegment(
                        (int) $customerId,
                        (int) $list->customer_segment_id,
                        $customer
                    ),
                default => false,
            };

            if ($matches) {
                return $this->applicableLists[$cacheKey] = $list;
            }
        }

        $this->applicableLists[$cacheKey] = null;

        return null;
    }

    private function getPriceListsForOutlet(int $outletId): EloquentCollection
    {
        if (! array_key_exists($outletId, $this->priceListsByOutlet)) {
            $this->priceListsByOutlet[$outletId] = PriceList::active()
                ->with('items')
                ->where(function ($query) use ($outletId) {
                    $query->whereNull('outlet_id');

                    if ($outletId > 0) {
                        $query->orWhere('outlet_id', $outletId);
                    }
                })
                ->orderByDesc('outlet_id')
                ->orderByDesc('priority')
                ->get();
        }

        return $this->priceListsByOutlet[$outletId];
    }

    private function customerBelongsToSegment(
        int $customerId,
        int $segmentId,
        Customer $customer
    ): bool {
        $key = $customerId.':'.$segmentId;

        if (! array_key_exists($key, $this->segmentMembership)) {
            $this->segmentMembership[$key] = $customer->segments()
                ->where('customer_segment_id', $segmentId)
                ->exists();
        }

        return $this->segmentMembership[$key];
    }

    public function getProductPrice(
        PriceList $priceList,
        int $productId
    ): ?int {
        if ($priceList->relationLoaded('items')) {
            $item = $priceList->items->firstWhere('product_id', $productId);

            return $item === null ? null : (int) $item->price;
        }

        return $priceList->items()
            ->where('product_id', $productId)
            ->value('price');
    }

    public function getBasePrice(
        Product $product,
        ?Customer $customer,
        ?Outlet $outlet = null
    ): int {
        if ($product->is_composite) {
            return (int) $product->components->sum(
                fn ($component) =>
                    (int) $component->sell_price
                    * (float) $component->pivot->qty
            );
        }

        $priceList = $this->getApplicablePriceList($customer, $outlet);

        if (! $priceList) {
            return (int) $product->sell_price;
        }

        return $this->getProductPrice($priceList, (int) $product->id)
            ?? (int) $product->sell_price;
    }
}
