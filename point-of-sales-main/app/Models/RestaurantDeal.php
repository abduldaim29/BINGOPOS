<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class RestaurantDeal extends Model
{
    use HasFactory;

    public const DEAL_TYPE_FIXED_PRICE = 'fixed_price';

    public const DEAL_TYPE_DYNAMIC_PRICE = 'dynamic_price';

    public const DEAL_TYPE_SLOT_BASED = 'slot_based';

    public const DEAL_TYPE_CUSTOM = 'custom';

    public const DISCOUNT_TYPE_PERCENTAGE = 'percentage';

    public const DISCOUNT_TYPE_FIXED_AMOUNT = 'fixed_amount';

    public const DISCOUNT_TYPE_FIXED_PRICE = 'fixed_price';

    protected $fillable = [
        'name',
        'description',
        'deal_type',
        'discount_type',
        'discount_value',
        'fixed_price',
        'is_active',
        'priority',
        'outlet_id',
        'starts_at',
        'ends_at',
        'max_per_customer',
        'min_products',
        'max_products',
        'created_by',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'priority' => 'integer',
        'outlet_id' => 'integer',
        'discount_value' => 'decimal:2',
        'fixed_price' => 'decimal:2',
        'max_per_customer' => 'integer',
        'min_products' => 'integer',
        'max_products' => 'integer',
        'created_by' => 'integer',
        'starts_at' => 'datetime',
        'ends_at' => 'datetime',
    ];

    public function outlet(): BelongsTo
    {
        return $this->belongsTo(Outlet::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function items(): HasMany
    {
        return $this->hasMany(RestaurantDealItem::class)
            ->orderBy('sort_order')
            ->orderBy('id');
    }

    public function slots(): HasMany
    {
        return $this->hasMany(RestaurantDealSlot::class)
            ->orderBy('sort_order')
            ->orderBy('id');
    }

    public function isScheduled(): bool
    {
        return $this->starts_at && $this->starts_at->isFuture();
    }

    public function isExpired(): bool
    {
        return $this->ends_at && $this->ends_at->isPast();
    }

    public function currentStatusLabel(): string
    {
        if (! $this->is_active) {
            return 'inactive';
        }

        if ($this->isScheduled()) {
            return 'scheduled';
        }

        if ($this->isExpired()) {
            return 'expired';
        }

        return 'active';
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeForOutlet($query, ?Outlet $outlet)
    {
        return $query->where(function ($q) use ($outlet) {
            $q->whereNull('outlet_id');
            if ($outlet) {
                $q->orWhere('outlet_id', $outlet->id);
            }
        });
    }

    public function scopeValidAt($query, $at = null)
    {
        $at = $at ?? now();

        return $query->where(function ($q) use ($at) {
            $q->whereNull('starts_at')->orWhere('starts_at', '<=', $at);
        })->where(function ($q) use ($at) {
            $q->whereNull('ends_at')->orWhere('ends_at', '>=', $at);
        });
    }
}
