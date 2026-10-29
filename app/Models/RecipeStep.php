<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RecipeStep extends Model
{
    use HasFactory;

    protected $fillable = [
        'recipe_id', 'sort_order', 'title', 'instructions', 'duration_minutes',
        'temperature', 'temperature_unit', 'equipment',
    ];

    protected $casts = [
        'sort_order' => 'integer',
        'duration_minutes' => 'integer',
        'temperature' => 'decimal:2',
    ];

    public function recipe(): BelongsTo { return $this->belongsTo(Recipe::class); }
}
