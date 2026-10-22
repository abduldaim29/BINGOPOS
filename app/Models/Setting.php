<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Schema;

class Setting extends Model
{
    use HasFactory;

    protected $fillable = [
        'key',
        'outlet_id',
        'value',
        'description',
    ];

    /**
     * Get a setting value by key.
     */
    public static function get(string $key, $default = null)
    {
        $query = static::where('key', $key);

        if (Schema::hasColumn('settings', 'outlet_id')) {
            $query->whereNull('outlet_id');
        }

        $setting = $query->first();

        return $setting ? $setting->value : $default;
    }

    public static function getInt(string $key, int $default = 0): int
    {
        return (int) static::get($key, $default);
    }

    public static function getBool(string $key, bool $default = false): bool
    {
        return filter_var(static::get($key, $default ? '1' : '0'), FILTER_VALIDATE_BOOL);
    }

    public static function getForOutlet(string $key, ?Outlet $outlet, $default = null)
    {
        if ($outlet) {
            if (! Schema::hasColumn('settings', 'outlet_id')) {
                return static::get($key, $default);
            }

            $value = static::where('key', $key)->where('outlet_id', $outlet->id)->value('value');

            if ($value !== null) {
                return $value;
            }
        }

        return static::get($key, $default);
    }

    public static function getManyForOutlet(array $keys, ?Outlet $outlet, array $defaults = []): array
    {
        if ($keys === []) {
            return [];
        }

        $hasOutletColumn = Schema::hasColumn('settings', 'outlet_id');
        $query = static::query()->whereIn('key', $keys);

        if ($hasOutletColumn) {
            $query->where(function ($query) use ($outlet) {
                $query->whereNull('outlet_id');
                if ($outlet) {
                    $query->orWhere('outlet_id', $outlet->id);
                }
            });
        }

        $columns = ['key', 'value'];
        if ($hasOutletColumn) {
            $columns[] = 'outlet_id';
        }

        $values = [];
        foreach ($query->get($columns) as $setting) {
            $outletId = $hasOutletColumn ? ($setting->outlet_id ?? 0) : 0;
            $values[$outletId][$setting->key] = $setting->value;
        }

        $resolved = [];
        foreach ($keys as $key) {
            $resolved[$key] = ($outlet ? ($values[$outlet->id][$key] ?? null) : null)
                ?? $values[0][$key]
                ?? $defaults[$key]
                ?? null;
        }

        return $resolved;
    }

    public static function getBoolForOutlet(string $key, ?Outlet $outlet, bool $default = false): bool
    {
        return filter_var(static::getForOutlet($key, $outlet, $default ? '1' : '0'), FILTER_VALIDATE_BOOL);
    }

    public static function getIntForOutlet(string $key, ?Outlet $outlet, int $default = 0): int
    {
        return (int) static::getForOutlet($key, $outlet, $default);
    }

    public static function setForOutlet(string $key, $value, ?Outlet $outlet, ?string $description = null)
    {
        if (! $outlet) {
            return static::set($key, $value, $description);
        }

        if (! Schema::hasColumn('settings', 'outlet_id')) {
            return static::set($key, $value, $description);
        }

        return static::updateOrCreate(
            ['key' => $key, 'outlet_id' => $outlet->id],
            ['value' => $value, 'description' => $description]
        );
    }

    /**
     * Set a setting value by key.
     */
    public static function set(string $key, $value, ?string $description = null)
    {
        $attributes = ['key' => $key];

        if (Schema::hasColumn('settings', 'outlet_id')) {
            $attributes['outlet_id'] = null;
        }

        return static::updateOrCreate(
            $attributes,
            ['value' => $value, 'description' => $description]
        );
    }

    public static function setMany(array $settings): void
    {
        foreach ($settings as $key => $payload) {
            static::set(
                $key,
                $payload['value'] ?? null,
                $payload['description'] ?? null
            );
        }
    }

    /**
     * Get the currency code (e.g., PKR, USD, EUR).
     */
    public static function getCurrencyCode(?Outlet $outlet = null): string
    {
        return static::getForOutlet('currency_code', $outlet, 'PKR');
    }

    /**
     * Get the currency symbol (e.g., Rs, $, €).
     */
    public static function getCurrencySymbol(?Outlet $outlet = null): string
    {
        return static::getForOutlet('currency_symbol', $outlet, 'Rs');
    }

    /**
     * Get the currency locale for formatting (e.g., en-PK, en-US).
     */
    public static function getCurrencyLocale(?Outlet $outlet = null): string
    {
        return static::getForOutlet('currency_locale', $outlet, 'en-PK');
    }

    /**
     * Get the number of decimal places for currency.
     */
    public static function getCurrencyDecimalPlaces(?Outlet $outlet = null): int
    {
        return static::getIntForOutlet('currency_decimal_places', $outlet, 2);
    }

    /**
     * Format a number as currency.
     */
    public static function formatCurrency(float $amount, ?Outlet $outlet = null): string
    {
        $locale = static::getCurrencyLocale($outlet);
        $currencyCode = static::getCurrencyCode($outlet);
        $decimalPlaces = static::getCurrencyDecimalPlaces($outlet);

        return number_format($amount, $decimalPlaces, '.', ',');
    }
}