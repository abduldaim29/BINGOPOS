<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ManualSalesReport extends Model
{
    protected $fillable = [
        'code',
        'vendor_name',
        'report_date',
        'reference_number',
        'notes',
        'subtotal',
        'tax_total',
        'grand_total',
        'created_by',
    ];

    protected $casts = [
        'report_date' => 'date',
        'subtotal' => 'decimal:2',
        'tax_total' => 'decimal:2',
        'grand_total' => 'decimal:2',
    ];

    public function items(): HasMany
    {
        return $this->hasMany(ManualSalesReportItem::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
