<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Product extends Model
{
    use HasFactory, SoftDeletes;

    protected $casts = [
        'id' => 'integer',
        'category_id' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'buy_price' => 'integer',
        'sell_price' => 'integer',
        'stock' => 'integer',
        'tax_rate' => 'decimal:2',
        'min_stock' => 'integer',
        'max_stock' => 'integer',
        'is_composite' => 'boolean',
        'variations' => 'array',
        'variation_prices' => 'array',
    ];

    /**
     * Ensure variation_prices values are integers
     */
    protected function setVariationPricesAttribute($value)
    {
        if (is_array($value)) {
            $this->attributes['variation_prices'] = json_encode(array_map('intval', $value));
        } else {
            $this->attributes['variation_prices'] = $value;
        }
    }

    protected function getVariationPricesAttribute($value)
    {
        $decoded = json_decode($value, true);
        if (is_array($decoded)) {
            return array_map('intval', $decoded);
        }
        return [];
    }

    protected $fillable = [
        'image',
        'barcode',
        'sku',
        'title',
        'description',
        'buy_price',
        'sell_price',
        'category_id',
        'product_type_id',
        'sub_category_id',
        'stock',
        'tax_type',
        'tax_rate',
        'min_stock',
        'max_stock',
        'is_composite',
        'variations',
        'variation_prices',
    ];

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function productType(): BelongsTo
    {
        return $this->belongsTo(ProductType::class);
    }

    public function subCategory(): BelongsTo
    {
        return $this->belongsTo(SubCategory::class);
    }

    public function warehouses(): BelongsToMany
    {
        return $this->belongsToMany(Warehouse::class)
            ->withPivot('stock')
            ->using(ProductWarehouse::class)
            ->withTimestamps();
    }

    public function units(): BelongsToMany
    {
        return $this->belongsToMany(Unit::class, 'product_units')
            ->withPivot(['is_base', 'conversion_factor', 'buy_price', 'sell_price', 'barcode', 'sku_suffix'])
            ->using(ProductUnit::class)
            ->withTimestamps();
    }

    public function baseUnit(): ?Unit
    {
        return $this->units()->wherePivot('is_base', true)->first();
    }

    public function components(): BelongsToMany
    {
        return $this->belongsToMany(Product::class, 'composite_product_items', 'composite_product_id', 'component_product_id')
            ->withPivot('qty')
            ->withTimestamps();
    }

    public function compositeOf(): BelongsToMany
    {
        return $this->belongsToMany(Product::class, 'composite_product_items', 'component_product_id', 'composite_product_id');
    }

    public function compositeStock(): int
    {
        if (! $this->is_composite) {
            return $this->stockTotal();
        }

        $minStock = null;

        foreach ($this->components as $component) {
            $available = (int) floor($component->stockTotal() / max(1, (float) $component->pivot->qty));
            $minStock = $minStock === null ? $available : min($minStock, $available);
        }

        return $minStock ?? 0;
    }

    public function stockOpnameItems()
    {
        return $this->hasMany(StockOpnameItem::class);
    }

    public function transactionDetails()
    {
        return $this->hasMany(TransactionDetail::class);
    }

    public function carts()
    {
        return $this->hasMany(Cart::class);
    }

    public function stockMutations()
    {
        return $this->hasMany(StockMutation::class);
    }

    public function recipes()
    {
        return $this->hasMany(Recipe::class);
    }

    public function salesReturnItems()
    {
        return $this->hasMany(SalesReturnItem::class);
    }

    public function pricingRules()
    {
        return $this->hasMany(PricingRule::class);
    }

    public function stockTotal(): int
    {
        return (int) $this->warehouses()->sum('product_warehouse.stock');
    }

    public function isLowStock(?int $warehouseId = null): bool
    {
        if ($this->min_stock <= 0) {
            return false;
        }

        $stock = $warehouseId
            ? (int) ($this->warehouses()->where('warehouse_id', $warehouseId)->first()?->pivot->stock ?? 0)
            : $this->stockTotal();

        return $stock <= $this->min_stock;
    }

    public function suggestedOrderQty(): int
    {
        if ($this->max_stock <= 0 || $this->min_stock <= 0) {
            return 0;
        }

        return max(0, $this->max_stock - $this->stockTotal());
    }

    protected function image(): Attribute
{
    return Attribute::make(
        get: function ($value): ?string {
            if (! is_string($value) || trim($value) === '') {
                return null;
            }

            // Preserve already complete image URLs.
            if (preg_match('~^https?://~i', $value)) {
                return $value;
            }

            // Normalize previously stored image paths.
            $path = str_replace('\\', '/', trim($value));
            $path = ltrim($path, '/');
            $path = preg_replace('~^(?:public/)?storage/~i', '', $path) ?? $path;

            if (! str_starts_with($path, 'products/')) {
                $path = 'products/'.$path;
            }

            // Use the public Supabase bucket URL when S3 storage is enabled.
            if (config('filesystems.image_disk', 'public') === 's3') {
                $baseUrl = rtrim(
                    (string) config('filesystems.image_url'),
                    '/'
                );

                if ($baseUrl !== '') {
                    return $baseUrl.'/'.$path;
                }

                // Leave the normalized path available for frontend URL handling.
                return $path;
            }

            // Keep existing local development behavior.
            return asset('storage/'.$path);
        },
    );
}
}