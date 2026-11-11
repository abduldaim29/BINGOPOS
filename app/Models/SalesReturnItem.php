<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SalesReturnItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'sales_return_id',
        'transaction_detail_id',
        'product_id',
        'qty_sold',
        'qty_returned_before',
        'qty_return',
        'unit_price',
        'subtotal',
        'cost_total',
        'net_sales_total',
        'tax_refund_total',
        'return_reason',
        'restock_to_inventory',
    ];

    protected $casts = [
        'sales_return_id' => 'integer',
        'transaction_detail_id' => 'integer',
        'product_id' => 'integer',
        'qty_sold' => 'integer',
        'qty_returned_before' => 'integer',
        'qty_return' => 'integer',
        'unit_price' => 'integer',
        'subtotal' => 'integer',
        'cost_total' => 'integer',
        'net_sales_total' => 'integer',
        'tax_refund_total' => 'integer',
        'restock_to_inventory' => 'boolean',
    ];

    public function salesReturn()
    {
        return $this->belongsTo(SalesReturn::class);
    }

    public function transactionDetail()
    {
        return $this->belongsTo(TransactionDetail::class);
    }

    public function product()
    {
        return $this->belongsTo(Product::class)->withTrashed();
    }
}