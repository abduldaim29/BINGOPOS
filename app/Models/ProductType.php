<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Models\Category;
use App\Models\Product;
use App\Models\Recipe;

class ProductType extends Model
{
    protected $fillable = [
        'name',
        'short_name',
        'code',
        'description',
        'is_active',
        'sort_order',
        'color',
        'category_id',
        'product_id',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'sort_order' => 'integer',
    ];

    public function products(): HasMany
    {
        return $this->hasMany(Product::class);
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function recipe(): \Illuminate\Database\Eloquent\Relations\HasOne
    {
        return $this->hasOne(Recipe::class, 'product_type_id');
    }
}