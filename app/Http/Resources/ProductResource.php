<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProductResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'description' => $this->description,
            'barcode' => $this->barcode,
            'sku' => $this->sku,
            'image' => $this->image
                ? (str_starts_with($this->image, 'http') ? $this->image : url('storage/'.ltrim($this->image, '/')))
                : null,
            'category' => $this->whenLoaded('category', fn () => [
                'id' => $this->category->id,
                'name' => $this->category->name,
            ]),
            'buy_price' => (float) $this->buy_price,
            'sell_price' => (float) $this->sell_price,
            'stock' => (int) $this->stock,
            'min_stock' => (int) $this->min_stock,
            'max_stock' => (int) $this->max_stock,
            'tax_type' => $this->tax_type,
            'tax_rate' => (float) $this->tax_rate,
            'is_composite' => (bool) $this->is_composite,
            'variations' => $this->variations ?? [],
            'variation_prices' => $this->variation_prices ?? [],
            'units' => $this->whenLoaded('units', fn () => $this->units->map(fn ($unit) => [
                'unit_id' => $unit->id,
                'name' => $unit->name,
                'code' => $unit->code,
                'symbol' => $unit->symbol,
                'is_base' => (bool) $unit->pivot->is_base,
                'conversion_factor' => (float) $unit->pivot->conversion_factor,
                'sell_price' => (int) $unit->pivot->sell_price,
            ])->values()),
            'created_at' => optional($this->created_at)->toISOString(),
            'updated_at' => optional($this->updated_at)->toISOString(),
        ];
    }
}