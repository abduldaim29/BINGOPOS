<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Category extends Model
{
    use HasFactory;

    protected $casts = [
        'id' => 'integer',
    ];

    /**
     * fillable
     *
     * @var array
     */
    protected $fillable = [
        'image', 'name', 'description',
    ];

    /**
     * products
     *
     * @return void
     */
    public function products(): HasMany
    {
        return $this->hasMany(Product::class);
    }

    /**
     * subCategories
     *
     * @return void
     */
    public function subCategories(): HasMany
    {
        return $this->hasMany(SubCategory::class);
    }

    public function pricingRules()
    {
        return $this->hasMany(PricingRule::class);
    }

    /**
     * image
     */
    protected function image(): Attribute
    {
        return Attribute::make(
            get: fn ($value) => $value ? asset('/storage/category/'.$value) : null,
        );
    }
}
