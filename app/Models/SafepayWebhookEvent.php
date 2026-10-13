<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SafepayWebhookEvent extends Model
{
    protected $table = 'safepay_webhook_events';

    protected $fillable = [
        'event_id',
        'event_type',
        'aggregator_id',
        'payload',
        'processed_at',
    ];

    protected $casts = [
        'payload' => 'array',
        'processed_at' => 'datetime',
    ];
}
