<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RestaurantDealItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'restaurant_deal_id',
        'product_id',
        'restaurant_deal_slot_id',
        'is_required',
        'min_qty',
        'max_qty',
        'sort_order',
    ];

    protected $casts = [
        'restaurant_deal_id' => 'integer',
        'product_id' => 'integer',
        'restaurant_deal_slot_id' => 'integer',
        'is_required' => 'boolean',
        'min_qty' => 'integer',
        'max_qty' => 'integer',
        'sort_order' => 'integer',
    ];

    public function deal(): BelongsTo
    {
        return $this->belongsTo(RestaurantDeal::class, 'restaurant_deal_id');
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function slot(): BelongsTo
    {
        return $this->belongsTo(RestaurantDealSlot::class);
    }
}
