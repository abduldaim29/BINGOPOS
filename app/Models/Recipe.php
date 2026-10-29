<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Recipe extends Model
{
    use HasFactory;

    protected $fillable = [
        'product_id', 'product_type_id', 'code', 'name', 'recipe_type', 'batch_yield', 'yield_unit_id',
        'packaging_cost', 'labour_cost', 'overhead_cost', 'notes', 'status', 'created_by',
    ];

    protected $casts = [
        'batch_yield' => 'decimal:4',
        'packaging_cost' => 'decimal:2',
        'labour_cost' => 'decimal:2',
        'overhead_cost' => 'decimal:2',
    ];

    public function product(): BelongsTo { return $this->belongsTo(Product::class)->withTrashed(); }
    public function item(): BelongsTo { return $this->belongsTo(ProductType::class, 'product_type_id'); }
    public function yieldUnit(): BelongsTo { return $this->belongsTo(Unit::class, 'yield_unit_id'); }
    public function creator(): BelongsTo { return $this->belongsTo(User::class, 'created_by'); }
    public function ingredients(): HasMany { return $this->hasMany(RecipeIngredient::class); }
    public function steps(): HasMany { return $this->hasMany(RecipeStep::class)->orderBy('sort_order'); }
}
