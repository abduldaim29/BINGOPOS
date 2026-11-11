<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TransactionDetailRecipeConsumption extends Model
{
    protected $fillable = [
        'transaction_detail_id',
        'recipe_id',
        'ingredient_product_id',
        'unit_id',
        'warehouse_id',
        'quantity_per_sold_unit',
        'base_quantity_consumed',
        'batch_allocations',
    ];

    protected $casts = [
        'quantity_per_sold_unit' => 'decimal:6',
        'base_quantity_consumed' => 'decimal:6',
        'batch_allocations' => 'array',
    ];

    public function transactionDetail(): BelongsTo
    {
        return $this->belongsTo(TransactionDetail::class);
    }

    public function recipe(): BelongsTo
    {
        return $this->belongsTo(Recipe::class);
    }

    public function ingredientProduct(): BelongsTo
    {
        return $this->belongsTo(Product::class, 'ingredient_product_id')->withTrashed();
    }

    public function unit(): BelongsTo
    {
        return $this->belongsTo(Unit::class);
    }
}
