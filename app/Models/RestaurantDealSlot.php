<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class RestaurantDealSlot extends Model
{
    use HasFactory;

    protected $fillable = [
        'restaurant_deal_id',
        'name',
        'description',
        'min_selection',
        'max_selection',
        'sort_order',
    ];

    protected $casts = [
        'restaurant_deal_id' => 'integer',
        'min_selection' => 'integer',
        'max_selection' => 'integer',
        'sort_order' => 'integer',
    ];

    public function deal(): BelongsTo
    {
        return $this->belongsTo(RestaurantDeal::class, 'restaurant_deal_id');
    }

    public function items(): HasMany
    {
        return $this->hasMany(RestaurantDealItem::class, 'restaurant_deal_slot_id')
            ->orderBy('sort_order')
            ->orderBy('id');
    }
}
