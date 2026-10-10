<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Customer extends Model
{
    use HasFactory;

    /**
     * fillable
     *
     * @var array
     */
    protected $fillable = [
        'name',
        'no_telp',
        'email',
        'address',
        'is_loyalty_member',
        'is_walkin',
        'member_code',
        'loyalty_tier',
        'loyalty_points',
        'loyalty_total_spent',
        'loyalty_transaction_count',
        'loyalty_member_since',
        'last_purchase_at',
        'province_id',
        'province_name',
        'regency_id',
        'regency_name',
        'district_id',
        'district_name',
        'village_id',
        'village_name',
        'tax_id',
        'tax_name',
        'cnic',
        'ntn',
    ];

    protected $casts = [
        'is_loyalty_member' => 'boolean',
        'is_walkin' => 'boolean',
        'loyalty_points' => 'integer',
        'loyalty_total_spent' => 'integer',
        'loyalty_transaction_count' => 'integer',
        'loyalty_member_since' => 'datetime',
        'last_purchase_at' => 'datetime',
    ];

    public function salesReturns()
    {
        return $this->hasMany(SalesReturn::class);
    }

    public function customerCredits()
    {
        return $this->hasMany(CustomerCredit::class);
    }

    public function transactions()
    {
        return $this->hasMany(Transaction::class);
    }

    public function loyaltyPointHistories()
    {
        return $this->hasMany(LoyaltyPointHistory::class);
    }

    public function vouchers()
    {
        return $this->hasMany(CustomerVoucher::class);
    }

    public function receivables()
    {
        return $this->hasMany(Receivable::class);
    }

    public function segmentMemberships()
    {
        return $this->hasMany(CustomerSegmentMembership::class);
    }

    public function segments()
    {
        return $this->belongsToMany(CustomerSegment::class, 'customer_segment_memberships')
            ->withPivot(['source', 'matched_at'])
            ->withTimestamps();
    }

    /**
     * Scope to get only walk-in customers
     */
    public function scopeWalkIn($query)
    {
        return $query->where('is_walkin', true);
    }

    /**
     * Scope to get only regular (non-walk-in) customers
     */
    public function scopeRegular($query)
    {
        return $query->where('is_walkin', false);
    }
}
