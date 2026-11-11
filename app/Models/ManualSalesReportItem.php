<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ManualSalesReportItem extends Model
{
    protected $fillable = [
        'description',
        'quantity',
        'unit_rate',
        'tax_type',
        'tax_value',
        'subtotal',
        'tax_amount',
        'total',
    ];

    protected $casts = [
        'quantity' => 'decimal:3',
        'unit_rate' => 'decimal:2',
        'tax_value' => 'decimal:2',
        'subtotal' => 'decimal:2',
        'tax_amount' => 'decimal:2',
        'total' => 'decimal:2',
    ];

    public function report(): BelongsTo
    {
        return $this->belongsTo(ManualSalesReport::class, 'manual_sales_report_id');
    }
}
