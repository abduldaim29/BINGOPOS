<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RecipeIngredient extends Model
{
    use HasFactory;

    protected $fillable = [
        'recipe_id', 'product_id', 'ingredient_name', 'unit_id', 'quantity', 'wastage_percent',
        'purchase_price', 'purchase_price_source', 'purchase_tax_type',
        'purchase_tax_rate', 'purchase_tax_included',
    ];

    protected $casts = [
        'quantity' => 'decimal:6',
        'wastage_percent' => 'decimal:2',
        'purchase_price' => 'decimal:4',
        'purchase_tax_rate' => 'decimal:2',
        'purchase_tax_included' => 'boolean',
    ];

    public function recipe(): BelongsTo { return $this->belongsTo(Recipe::class); }
    public function product(): BelongsTo { return $this->belongsTo(Product::class)->withTrashed(); }
    public function unit(): BelongsTo { return $this->belongsTo(Unit::class); }
}
