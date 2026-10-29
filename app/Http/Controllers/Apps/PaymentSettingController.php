<?php

namespace App\Http\Controllers\Apps;

use App\Http\Controllers\Controller;
use App\Models\PaymentSetting;
use App\Services\AuditLogService;
use App\Services\OutletAccessService;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class PaymentSettingController extends Controller
{
    public function __construct(
        private readonly AuditLogService $auditLogService,
        private readonly OutletAccessService $outletAccessService
    ) {}

    public function edit()
    {
        $setting = $this->setting();

        $midtransWebhookUrl = route('webhooks.midtrans');
        $xenditWebhookUrl = route('webhooks.xendit');
        $safepayWebhookUrl = route('webhooks.safepay');
        $appUrl = (string) config('app.url');
        $webhookWarnings = [];

        if (blank($appUrl)) {
            $webhookWarnings[] = 'APP_URL is not configured. The generated webhook URL may be invalid for Midtrans/Xendit.';
        } elseif ($this->isLocalAppUrl($appUrl)) {
            $webhookWarnings[] = 'APP_URL still points to localhost or 127.0.0.1. Payment gateways require a public URL that is accessible from the internet.';
        }

        if ($setting->xendit_enabled && ! $setting->secretConfigured('xendit_callback_token')) {
            $webhookWarnings[] = 'Xendit is enabled, but the callback token has not been configured. Xendit webhooks will be rejected until the token is available.';
        }

        if ($setting->safepay_enabled && ! $setting->secretConfigured('safepay_webhook_secret')) {
            $webhookWarnings[] = 'Safepay is enabled, but the webhook secret has not been configured. Safepay webhooks will be rejected until the secret is available.';
        }

        if (collect($setting->paymentSettingSources())->contains(fn (array $source) => $source['source'] === 'env')) {
            $this->auditLogService->log(
                event: 'security.payment_secret_source_overridden',
                module: 'security',
                auditable: $setting,
                description: 'Payment configuration uses an environment variable override for sensitive secrets.',
                meta: [
                    'severity' => 'info',
                    'sources' => collect($setting->paymentSettingSources())
                        ->filter(fn (array $source) => $source['source'] === 'env')
                        ->keys()
                        ->values()
                        ->all(),
                ],
            );
        }

        return Inertia::render('Dashboard/Settings/Payment', [
            'setting' => [
                'default_gateway' => $setting->default_gateway,
                'bank_transfer_enabled' => (bool) $setting->bank_transfer_enabled,
                'midtrans_enabled' => (bool) $setting->midtrans_enabled,
                'midtrans_client_key' => $setting->midtrans_client_key,
                'midtrans_production' => (bool) $setting->midtrans_production,
                'xendit_enabled' => (bool) $setting->xendit_enabled,
                'xendit_public_key' => $setting->xendit_public_key,
                'xendit_production' => (bool) $setting->xendit_production,
                'safepay_enabled' => (bool) $setting->safepay_enabled,
                'safepay_aggregator_id' => $setting->safepay_aggregator_id,
                'safepay_aggregator_merchant_identifier' => $setting->safepay_aggregator_merchant_identifier,
                'safepay_production' => (bool) $setting->safepay_production,
            ],
            'paymentSettingSources' => $setting->paymentSettingSources(),
            'supportedGateways' => [
                ['value' => 'cash', 'label' => 'Cash'],
                ['value' => PaymentSetting::GATEWAY_BANK_TRANSFER, 'label' => 'Bank Transfer'],
                ['value' => PaymentSetting::GATEWAY_MIDTRANS, 'label' => 'Midtrans'],
                ['value' => PaymentSetting::GATEWAY_XENDIT, 'label' => 'Xendit'],
                ['value' => PaymentSetting::GATEWAY_SAFEPAY, 'label' => 'Safepay Raast'],
            ],
            'webhookUrls' => [
                'midtrans' => $midtransWebhookUrl,
                'xendit' => $xenditWebhookUrl,
                'safepay' => $safepayWebhookUrl,
            ],
            'webhookWarnings' => $webhookWarnings,
        ]);
    }

    public function update(Request $request)
    {
        $setting = $this->setting();
        $beforeState = $setting->replicate();

        $data = $request->validate([
            'default_gateway' => [
                'required',
                Rule::in(['cash', PaymentSetting::GATEWAY_BANK_TRANSFER, PaymentSetting::GATEWAY_MIDTRANS, PaymentSetting::GATEWAY_XENDIT, PaymentSetting::GATEWAY_SAFEPAY]),
            ],
            'bank_transfer_enabled' => ['boolean'],
            'midtrans_enabled' => ['boolean'],
            'midtrans_server_key' => ['nullable', 'string'],
            'midtrans_client_key' => ['nullable', 'string'],
            'midtrans_production' => ['boolean'],
            'xendit_enabled' => ['boolean'],
            'xendit_secret_key' => ['nullable', 'string'],
            'xendit_public_key' => ['nullable', 'string'],
            'xendit_callback_token' => ['nullable', 'string', 'max:255'],
            'xendit_production' => ['boolean'],
            'safepay_enabled' => ['boolean'],
            'safepay_aggregator_id' => ['nullable', 'string'],
            'safepay_secret_key' => ['nullable', 'string'],
            'safepay_webhook_secret' => ['nullable', 'string'],
            'safepay_aggregator_merchant_identifier' => ['nullable', 'string'],
            'safepay_production' => ['boolean'],
        ]);

        $midtransEnabled = (bool) ($data['midtrans_enabled'] ?? false);
        $xenditEnabled = (bool) ($data['xendit_enabled'] ?? false);
        $safepayEnabled = (bool) ($data['safepay_enabled'] ?? false);

        $resolvedMidtransServerKey = $setting->secretManagedByEnvironment('midtrans_server_key')
            ? $setting->resolvedSecret('midtrans_server_key')
            : ($data['midtrans_server_key'] ?: $setting->getAttributeValue('midtrans_server_key'));

        $resolvedXenditSecretKey = $setting->secretManagedByEnvironment('xendit_secret_key')
            ? $setting->resolvedSecret('xendit_secret_key')
            : ($data['xendit_secret_key'] ?: $setting->getAttributeValue('xendit_secret_key'));

        $resolvedXenditCallbackToken = $setting->secretManagedByEnvironment('xendit_callback_token')
            ? $setting->resolvedSecret('xendit_callback_token')
            : ($data['xendit_callback_token'] ?: $setting->getAttributeValue('xendit_callback_token'));

        $resolvedSafepaySecretKey = $setting->secretManagedByEnvironment('safepay_secret_key')
            ? $setting->resolvedSecret('safepay_secret_key')
            : (($data['safepay_secret_key'] ?? null) ?: $setting->getAttributeValue('safepay_secret_key'));

        $resolvedSafepayWebhookSecret = $setting->secretManagedByEnvironment('safepay_webhook_secret')
            ? $setting->resolvedSecret('safepay_webhook_secret')
            : (($data['safepay_webhook_secret'] ?? null) ?: $setting->getAttributeValue('safepay_webhook_secret'));

        if ($midtransEnabled && (blank($resolvedMidtransServerKey) || empty($data['midtrans_client_key']))) {
            return back()->withErrors([
                'midtrans_server_key' => 'Midtrans Server Key and Client Key are required when enabling Midtrans.',
            ])->withInput();
        }

        if ($xenditEnabled && blank($resolvedXenditSecretKey)) {
            return back()->withErrors([
                'xendit_secret_key' => 'The Xendit Secret Key is required when enabling Xendit.',
            ])->withInput();
        }

        if ($xenditEnabled && blank($resolvedXenditCallbackToken)) {
            return back()->withErrors([
                'xendit_callback_token' => 'The Xendit callback token is required when enabling Xendit.',
            ])->withInput();
        }

        if ($safepayEnabled && (blank($data['safepay_aggregator_id']) || blank($resolvedSafepaySecretKey) || blank($data['safepay_aggregator_merchant_identifier']))) {
            return back()->withErrors([
                'safepay_aggregator_id' => 'Aggregator ID, Secret Key, and Merchant Identifier are required when enabling Safepay.',
            ])->withInput();
        }

        if (
            $data['default_gateway'] !== 'cash'
            && ! (($data['default_gateway'] === PaymentSetting::GATEWAY_MIDTRANS && $midtransEnabled)
                || ($data['default_gateway'] === PaymentSetting::GATEWAY_XENDIT && $xenditEnabled)
                || ($data['default_gateway'] === PaymentSetting::GATEWAY_SAFEPAY && $safepayEnabled))
        ) {
            return back()->withErrors([
                'default_gateway' => 'The default gateway must be enabled.',
            ])->withInput();
        }

        $setting->update([
            'default_gateway' => $data['default_gateway'],
            'bank_transfer_enabled' => (bool) ($data['bank_transfer_enabled'] ?? false),
            'midtrans_enabled' => $midtransEnabled,
            'midtrans_server_key' => $setting->secretManagedByEnvironment('midtrans_server_key')
                ? $setting->getRawOriginal('midtrans_server_key')
                : (($data['midtrans_server_key'] ?? null) ?: $setting->getAttributeValue('midtrans_server_key')),
            'midtrans_client_key' => $data['midtrans_client_key'] ?? null,
            'midtrans_production' => (bool) ($data['midtrans_production'] ?? false),
            'xendit_enabled' => $xenditEnabled,
            'xendit_secret_key' => $setting->secretManagedByEnvironment('xendit_secret_key')
                ? $setting->getRawOriginal('xendit_secret_key')
                : (($data['xendit_secret_key'] ?? null) ?: $setting->getAttributeValue('xendit_secret_key')),
            'xendit_public_key' => $data['xendit_public_key'] ?? null,
            'xendit_callback_token' => $setting->secretManagedByEnvironment('xendit_callback_token')
                ? $setting->getRawOriginal('xendit_callback_token')
                : (($data['xendit_callback_token'] ?? null) ?: $setting->getAttributeValue('xendit_callback_token')),
            'xendit_production' => (bool) ($data['xendit_production'] ?? false),
            'safepay_enabled' => $safepayEnabled,
            'safepay_aggregator_id' => $data['safepay_aggregator_id'] ?? null,
            'safepay_secret_key' => $setting->secretManagedByEnvironment('safepay_secret_key')
                ? $setting->getRawOriginal('safepay_secret_key')
                : (($data['safepay_secret_key'] ?? null) ?: $setting->getAttributeValue('safepay_secret_key')),
            'safepay_webhook_secret' => $setting->secretManagedByEnvironment('safepay_webhook_secret')
                ? $setting->getRawOriginal('safepay_webhook_secret')
                : (($data['safepay_webhook_secret'] ?? null) ?: $setting->getAttributeValue('safepay_webhook_secret')),
            'safepay_aggregator_merchant_identifier' => $data['safepay_aggregator_merchant_identifier'] ?? null,
            'safepay_production' => (bool) ($data['safepay_production'] ?? false),
        ]);

        $this->auditLogService->log(
            event: 'payment.setting.updated',
            module: 'payment_settings',
            auditable: $setting,
            description: 'Payment gateway configuration updated.',
            before: [
                'default_gateway' => $beforeState->default_gateway,
                'bank_transfer_enabled' => (bool) $beforeState->bank_transfer_enabled,
                'midtrans_enabled' => (bool) $beforeState->midtrans_enabled,
                'midtrans_production' => (bool) $beforeState->midtrans_production,
                'xendit_enabled' => (bool) $beforeState->xendit_enabled,
                'xendit_production' => (bool) $beforeState->xendit_production,
                'safepay_enabled' => (bool) $beforeState->safepay_enabled,
                'safepay_production' => (bool) $beforeState->safepay_production,
                'midtrans_server_key' => filled($beforeState->midtrans_server_key) ? 'configured' : 'empty',
                'midtrans_client_key' => filled($beforeState->midtrans_client_key) ? 'configured' : 'empty',
                'xendit_secret_key' => filled($beforeState->xendit_secret_key) ? 'configured' : 'empty',
                'xendit_public_key' => filled($beforeState->xendit_public_key) ? 'configured' : 'empty',
                'xendit_callback_token' => filled($beforeState->xendit_callback_token) ? 'configured' : 'empty',
                'safepay_aggregator_id' => filled($beforeState->safepay_aggregator_id) ? 'configured' : 'empty',
                'safepay_aggregator_merchant_identifier' => filled($beforeState->safepay_aggregator_merchant_identifier) ? 'configured' : 'empty',
            ],
            after: [
                'default_gateway' => $setting->default_gateway,
                'bank_transfer_enabled' => (bool) $setting->bank_transfer_enabled,
                'midtrans_enabled' => (bool) $setting->midtrans_enabled,
                'midtrans_production' => (bool) $setting->midtrans_production,
                'xendit_enabled' => (bool) $setting->xendit_enabled,
                'xendit_production' => (bool) $setting->xendit_production,
                'safepay_enabled' => (bool) $setting->safepay_enabled,
                'safepay_production' => (bool) $setting->safepay_production,
                'midtrans_server_key' => $this->auditLogService->credentialState($beforeState->midtrans_server_key, $setting->midtrans_server_key),
                'midtrans_client_key' => $this->auditLogService->credentialState($beforeState->midtrans_client_key, $setting->midtrans_client_key),
                'xendit_secret_key' => $this->auditLogService->credentialState($beforeState->xendit_secret_key, $setting->xendit_secret_key),
                'xendit_public_key' => $this->auditLogService->credentialState($beforeState->xendit_public_key, $setting->xendit_public_key),
                'xendit_callback_token' => $this->auditLogService->credentialState($beforeState->xendit_callback_token, $setting->xendit_callback_token),
                'safepay_aggregator_id' => $this->auditLogService->credentialState($beforeState->safepay_aggregator_id, $setting->safepay_aggregator_id),
                'safepay_aggregator_merchant_identifier' => $this->auditLogService->credentialState($beforeState->safepay_aggregator_merchant_identifier, $setting->safepay_aggregator_merchant_identifier),
            ],
        );

        if (collect($setting->paymentSettingSources())->contains(fn (array $source) => $source['source'] === 'env')) {
            $this->auditLogService->log(
                event: 'security.payment_secret_source_overridden',
                module: 'security',
                auditable: $setting,
                description: 'Changes to payment settings remain subject to environment variable overrides for sensitive secrets.',
                meta: [
                    'severity' => 'info',
                    'sources' => collect($setting->paymentSettingSources())
                        ->filter(fn (array $source) => $source['source'] === 'env')
                        ->keys()
                        ->values()
                        ->all(),
                ],
            );
        }

        return redirect()
            ->route('settings.payments.edit')
            ->with('success', 'Payment gateway configuration saved successfully.');
    }

    private function isLocalAppUrl(string $appUrl): bool
    {
        $host = parse_url($appUrl, PHP_URL_HOST);

        return in_array($host, ['localhost', '127.0.0.1'], true)
            || str_ends_with((string) $host, '.test');
    }

    private function setting(): PaymentSetting
    {
        $outlet = $this->outletAccessService->activeOutlet(request());

        return PaymentSetting::forOutletOrCreate($outlet);
    }
}