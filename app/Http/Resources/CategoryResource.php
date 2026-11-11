<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CategoryResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'description' => $this->description,
            'image' => $this->image
                ? (str_starts_with($this->image, 'http') || str_starts_with($this->image, '/storage/')
                    ? $this->image
                    : '/storage/'.(str_starts_with(ltrim($this->image, '/'), 'category/')
                        ? ltrim($this->image, '/')
                        : 'category/'.ltrim($this->image, '/')))
                : null,
            'products_count' => $this->whenCounted('products'),
        ];
    }
}