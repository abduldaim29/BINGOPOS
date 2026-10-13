<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PaymentSetting extends Model
{
    use HasFactory;

    public const GATEWAY_MIDTRANS = 'midtrans';

    public const GATEWAY_XENDIT = 'xendit';

    public const GATEWAY_SAFEPAY = 'safepay';

    public const GATEWAY_BANK_TRANSFER = 'bank_transfer';

    public const SECRET_FIELDS = [
        'midtrans_server_key',
        'xendit_secret_key',
        'xendit_callback_token',
        'safepay_secret_key',
        'safepay_webhook_secret',
    ];

    protected $fillable = [
        'default_gateway',
        'outlet_id',
        'bank_transfer_enabled',
        'midtrans_enabled',
        'midtrans_server_key',
        'midtrans_client_key',
        'midtrans_production',
        'xendit_enabled',
        'xendit_secret_key',
        'xendit_public_key',
        'xendit_callback_token',
        'xendit_production',
        'safepay_enabled',
        'safepay_aggregator_id',
        'safepay_secret_key',
        'safepay_webhook_secret',
        'safepay_aggregator_merchant_identifier',
        'safepay_production',
    ];

    protected $casts = [
        'outlet_id' => 'integer',
        'bank_transfer_enabled' => 'boolean',
        'midtrans_enabled' => 'boolean',
        'midtrans_production' => 'boolean',
        'xendit_enabled' => 'boolean',
        'xendit_production' => 'boolean',
        'safepay_enabled' => 'boolean',
        'safepay_production' => 'boolean',
        'midtrans_server_key' => 'encrypted',
        'xendit_secret_key' => 'encrypted',
        'xendit_callback_token' => 'encrypted',
        'safepay_secret_key' => 'encrypted',
        'safepay_webhook_secret' => 'encrypted',
    ];

    public static function forOutlet(?Outlet $outlet): ?self
    {
        if ($outlet) {
            $scoped = static::where('outlet_id', $outlet->id)->first();
            if ($scoped) {
                return $scoped;
            }
        }

        return static::whereNull('outlet_id')->first();
    }

    public static function forOutletOrCreate(?Outlet $outlet): self
    {
        if (! $outlet) {
            return static::firstOrCreate([], ['default_gateway' => 'cash']);
        }

        $scoped = static::where('outlet_id', $outlet->id)->first();
        if ($scoped) {
            return $scoped;
        }

        $setting = static::whereNull('outlet_id')->first();
        if ($setting) {
            $scoped = $setting->replicate();
            $scoped->outlet_id = $outlet->id;
            $scoped->save();

            return $scoped;
        }

        return static::create(['default_gateway' => 'cash', 'outlet_id' => $outlet->id]);
    }

    public function enabledGateways(?Outlet $outlet = null): array
    {
        $gateways = [];

        // Bank Transfer
        if ($this->isBankTransferReady($outlet)) {
            $gateways[] = [
                'value' => self::GATEWAY_BANK_TRANSFER,
                'label' => 'Bank Transfer',
                'description' => 'Manual payment via bank transfer.',
            ];
        }

        if ($this->isGatewayReady(self::GATEWAY_MIDTRANS)) {
            $gateways[] = [
                'value' => self::GATEWAY_MIDTRANS,
                'label' => 'Midtrans',
                'description' => 'Share a Midtrans Snap payment link with customers.',
            ];
        }

        if ($this->isGatewayReady(self::GATEWAY_XENDIT)) {
            $gateways[] = [
                'value' => self::GATEWAY_XENDIT,
                'label' => 'Xendit',
                'description' => 'Create invoices automatically using Xendit.',
            ];
        }

        if ($this->isGatewayReady(self::GATEWAY_SAFEPAY)) {
            $gateways[] = [
                'value' => self::GATEWAY_SAFEPAY,
                'label' => 'Safepay Raast',
                'description' => 'Dynamic Raast QR payments in Pakistan through Safepay.',
            ];
        }

        return $gateways;
    }

    /**
     * Check if bank transfer is ready (enabled and has active bank accounts).
     */
    public function isBankTransferReady(?Outlet $outlet = null): bool
    {
        return $this->bank_transfer_enabled && BankAccount::active()->forOutlet($outlet)->exists();
    }

    public function isGatewayReady(string $gateway): bool
    {
        return match ($gateway) {
            self::GATEWAY_BANK_TRANSFER => $this->isBankTransferReady(),
            self::GATEWAY_MIDTRANS => $this->midtrans_enabled
            && filled($this->resolvedSecret('midtrans_server_key'))
            && filled($this->midtrans_client_key),
            self::GATEWAY_XENDIT => $this->xendit_enabled
            && filled($this->resolvedSecret('xendit_secret_key'))
            && filled($this->xendit_public_key),
            self::GATEWAY_SAFEPAY => $this->safepay_enabled
            && filled($this->safepay_aggregator_id)
            && filled($this->resolvedSecret('safepay_secret_key'))
            && filled($this->safepay_aggregator_merchant_identifier),
            default => false,
        };
    }

    public function midtransConfig(): array
    {
        return [
            'enabled' => $this->isGatewayReady(self::GATEWAY_MIDTRANS),
            'server_key' => $this->resolvedSecret('midtrans_server_key'),
            'client_key' => $this->midtrans_client_key,
            'is_production' => $this->midtrans_production,
        ];
    }

    public function xenditConfig(): array
    {
        return [
            'enabled' => $this->isGatewayReady(self::GATEWAY_XENDIT),
            'secret_key' => $this->resolvedSecret('xendit_secret_key'),
            'public_key' => $this->xendit_public_key,
            'callback_token' => $this->resolvedSecret('xendit_callback_token'),
            'is_production' => $this->xendit_production,
        ];
    }

    public function safepayConfig(): array
    {
        return [
            'enabled' => $this->isGatewayReady(self::GATEWAY_SAFEPAY),
            'aggregator_id' => $this->safepay_aggregator_id,
            'secret_key' => $this->resolvedSecret('safepay_secret_key'),
            'webhook_secret' => $this->resolvedSecret('safepay_webhook_secret'),
            'aggregator_merchant_identifier' => $this->safepay_aggregator_merchant_identifier,
            'is_production' => $this->safepay_production,
        ];
    }

    public function resolvedSecret(string $field): ?string
    {
        $envValue = $this->envSecretValue($field);

        if (filled($envValue)) {
            return $envValue;
        }

        return $this->getAttributeValue($field);
    }

    public function secretSource(string $field): string
    {
        if (filled($this->envSecretValue($field))) {
            return 'env';
        }

        if (filled($this->getAttributeValue($field))) {
            return 'database';
        }

        return 'none';
    }

    public function secretConfigured(string $field): bool
    {
        return filled($this->resolvedSecret($field));
    }

    public function secretManagedByEnvironment(string $field): bool
    {
        return $this->secretSource($field) === 'env';
    }

    public function maskedSecret(string $field): ?string
    {
        $value = $this->resolvedSecret($field);

        if (blank($value)) {
            return null;
        }

        $length = strlen($value);

        if ($length <= 4) {
            return str_repeat('•', $length);
        }

        return str_repeat('•', max($length - 4, 4)).substr($value, -4);
    }

    public function paymentSettingSources(): array
    {
        return [
            'midtrans_server_key' => $this->secretMetadata('midtrans_server_key'),
            'xendit_secret_key' => $this->secretMetadata('xendit_secret_key'),
            'xendit_callback_token' => $this->secretMetadata('xendit_callback_token'),
            'safepay_secret_key' => $this->secretMetadata('safepay_secret_key'),
            'safepay_webhook_secret' => $this->secretMetadata('safepay_webhook_secret'),
        ];
    }

    private function secretMetadata(string $field): array
    {
        return [
            'source' => $this->secretSource($field),
            'configured' => $this->secretConfigured($field),
            'managed_by_environment' => $this->secretManagedByEnvironment($field),
            'masked' => $this->maskedSecret($field),
        ];
    }

    private function envSecretValue(string $field): ?string
    {
        return match ($field) {
            'midtrans_server_key' => config('services.midtrans.server_key'),
            'xendit_secret_key' => config('services.xendit.secret_key'),
            'xendit_callback_token' => config('services.xendit.callback_token'),
            'safepay_secret_key' => config('services.safepay.secret_key'),
            'safepay_webhook_secret' => config('services.safepay.webhook_secret'),
            default => null,
        };
    }
}