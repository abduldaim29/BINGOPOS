<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TransactionDetail extends Model
{
    use HasFactory;

    /**
     * fillable
     *
     * @var array
     */
    protected $fillable = [
        'transaction_id',
        'product_id',
        'unit_id',
        'conversion_factor',
        'qty',
        'base_unit_price',
        'unit_price',
        'price',
        'cost_total',
        'taxable_amount',
        'gross_sales_amount',
        'tax_total',
        'tax_rate',
        'tax_type',
        'discount_total',
        'product_batch_id',
        'pricing_rule_id',
        'pricing_rule_name',
        'pricing_rule_kind',
        'pricing_group_key',
        'pricing_group_label',
        'restaurant_deal_id',
        'restaurant_deal_name',
        'restaurant_deal_type',
        'variation_id',
        'variation_name',
        'extras',
    ];

    protected $casts = [
        'qty' => 'integer',
        'base_unit_price' => 'integer',
        'unit_price' => 'integer',
        'price' => 'integer',
        'cost_total' => 'integer',
        'taxable_amount' => 'integer',
        'gross_sales_amount' => 'integer',
        'tax_total' => 'integer',
        'tax_rate' => 'decimal:4',
        'discount_total' => 'integer',
        'pricing_rule_id' => 'integer',
        'pricing_rule_kind' => 'string',
        'conversion_factor' => 'decimal:4',
        'extras' => 'array',
    ];

    public function transaction()
    {
        return $this->belongsTo(Transaction::class);
    }

    public function product()
    {
        return $this->belongsTo(Product::class)->withTrashed();
    }

    public function unit()
    {
        return $this->belongsTo(Unit::class);
    }

    public function batch()
    {
        return $this->belongsTo(ProductBatch::class, 'product_batch_id');
    }

    public function pricingRule()
    {
        return $this->belongsTo(PricingRule::class);
    }

    public function restaurantDeal()
    {
        return $this->belongsTo(RestaurantDeal::class);
    }

    public function salesReturnItems()
    {
        return $this->hasMany(SalesReturnItem::class);
    }

    public function batchAllocations()
    {
        return $this->hasMany(TransactionDetailBatchAllocation::class);
    }

    public function recipeConsumptions()
    {
        return $this->hasMany(TransactionDetailRecipeConsumption::class);
    }
}
