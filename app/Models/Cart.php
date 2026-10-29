<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Cart extends Model
{
    use HasFactory;

    protected $fillable = [
        'cashier_id', 'warehouse_id', 'product_id', 'unit_id', 'conversion_factor', 'qty', 'price', 'hold_id', 'hold_label', 'held_at', 'variation_id', 'variation_name', 'extras',
    ];

    /**
     * Get the unit price for this cart item.
     * For variations, derives from stored line total.
     * For non-variations, uses UnitConversionService.
     */
    public function getUnitPriceAttribute(): int
    {
        if ($this->variation_id && $this->qty > 0) {
            return (int) round($this->price / $this->qty);
        }

        return (int) round($this->price / max(1, (int) $this->qty));
    }

    protected $casts = [
        'held_at' => 'datetime',
        'conversion_factor' => 'decimal:4',
        'extras' => 'array',
    ];

    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    public function warehouse()
    {
        return $this->belongsTo(Warehouse::class);
    }

    public function unit()
    {
        return $this->belongsTo(Unit::class);
    }

    public function getUnitNameAttribute()
    {
        return $this->unit?->name ?? null;
    }

    public function scopeActive($query)
    {
        return $query->whereNull('hold_id');
    }

    public function scopeHeld($query)
    {
        return $query->whereNotNull('hold_id');
    }

    public function scopeForHold($query, $holdId)
    {
        return $query->where('hold_id', $holdId);
    }
}