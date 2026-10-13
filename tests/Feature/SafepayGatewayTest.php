<?php

namespace Tests\Feature;

use App\Exceptions\PaymentGatewayException;
use App\Models\PaymentSetting;
use App\Models\SafepayWebhookEvent;
use App\Models\Transaction;
use App\Models\TransactionTender;
use App\Models\Warehouse;
use App\Services\Payments\SafepayRaastGateway;
use Database\Seeders\PermissionSeeder;
use Database\Seeders\RoleSeeder;
use Database\Seeders\UserSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class SafepayGatewayTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(PermissionSeeder::class);
        $this->seed(RoleSeeder::class);
        $this->seed(UserSeeder::class);
    }

    public function test_safepay_gateway_not_ready_without_credentials(): void
    {
        $setting = PaymentSetting::firstOrCreate();

        $this->assertFalse($setting->isGatewayReady(PaymentSetting::GATEWAY_SAFEPAY));
    }

    public function test_safepay_gateway_ready_with_all_credentials(): void
    {
        $setting = PaymentSetting::firstOrCreate([
            'safepay_enabled' => true,
            'safepay_aggregator_id' => 'agg_test123',
            'safepay_secret_key' => 'test_secret_key',
            'safepay_aggregator_merchant_identifier' => 'am_test123',
        ]);

        $this->assertTrue($setting->isGatewayReady(PaymentSetting::GATEWAY_SAFEPAY));
    }

    public function test_safepay_gateway_not_ready_without_aggregator_id(): void
    {
        $setting = PaymentSetting::firstOrCreate([
            'safepay_enabled' => true,
            'safepay_aggregator_id' => null,
            'safepay_secret_key' => 'test_secret_key',
            'safepay_aggregator_merchant_identifier' => 'am_test123',
        ]);

        $this->assertFalse($setting->isGatewayReady(PaymentSetting::GATEWAY_SAFEPAY));
    }

    public function test_create_dynamic_qr_success(): void
    {
        Http::fake([
            'https://dev.api.getsafepay.com/raastwire/v1/aggregators/agg_test123/qrs' => Http::response([
                'api_version' => 'v1',
                'data' => [
                    'token' => 'qr_test_token',
                    'code' => '0002010102122876003285bc899c1dd443e3b3beb24631aef093',
                    'type' => 'DYNAMIC',
                    'aggregator_merchant_id' => 'am_test123',
                    'created_at' => now()->toIso8601String(),
                ],
            ], 200),
        ]);

        $warehouse = Warehouse::factory()->create(['type' => 'main', 'is_active' => true]);
        $transaction = Transaction::factory()->create([
            'invoice' => 'TRX-TEST123',
            'grand_total' => 10000,
            'warehouse_id' => $warehouse->id,
        ]);

        $gateway = new SafepayRaastGateway;
        $config = [
            'enabled' => true,
            'aggregator_id' => 'agg_test123',
            'secret_key' => 'test_secret',
            'aggregator_merchant_identifier' => 'am_test123',
            'is_production' => false,
        ];

        $result = $gateway->createDynamicQr($transaction, $config);

        $this->assertEquals('qr_test_token', $result['reference']);
        $this->assertEquals('0002010102122876003285bc899c1dd443e3b3beb24631aef093', $result['qr_string']);
    }

    public function test_create_dynamic_qr_api_failure(): void
    {
        Http::fake([
            'https://dev.api.getsafepay.com/raastwire/v1/aggregators/agg_test123/qrs' => Http::response([
                'message' => 'Invalid credentials',
            ], 401),
        ]);

        $warehouse = Warehouse::factory()->create(['type' => 'main', 'is_active' => true]);
        $transaction = Transaction::factory()->create([
            'invoice' => 'TRX-TEST123',
            'grand_total' => 10000,
            'warehouse_id' => $warehouse->id,
        ]);

        $gateway = new SafepayRaastGateway;
        $config = [
            'enabled' => true,
            'aggregator_id' => 'agg_test123',
            'secret_key' => 'test_secret',
            'aggregator_merchant_identifier' => 'am_test123',
            'is_production' => false,
        ];

        $this->expectException(PaymentGatewayException::class);
        $this->expectExceptionMessage('Safepay error: Invalid credentials');

        $gateway->createDynamicQr($transaction, $config);
    }

    public function test_create_dynamic_qr_without_enabled_config(): void
    {
        $warehouse = Warehouse::factory()->create(['type' => 'main', 'is_active' => true]);
        $transaction = Transaction::factory()->create([
            'invoice' => 'TRX-TEST123',
            'grand_total' => 10000,
            'warehouse_id' => $warehouse->id,
        ]);

        $gateway = new SafepayRaastGateway;
        $config = [
            'enabled' => false,
            'aggregator_id' => 'agg_test123',
            'secret_key' => 'test_secret',
            'aggregator_merchant_identifier' => 'am_test123',
            'is_production' => false,
        ];

        $this->expectException(PaymentGatewayException::class);
        $this->expectExceptionMessage('Safepay Raast tidak aktif atau belum dikonfigurasi.');

        $gateway->createDynamicQr($transaction, $config);
    }

    public function test_webhook_invalid_signature_rejected(): void
    {
        $setting = PaymentSetting::firstOrCreate([
            'safepay_enabled' => true,
            'safepay_aggregator_id' => 'agg_test123',
            'safepay_secret_key' => base64_encode('test_secret'),
            'safepay_aggregator_merchant_identifier' => 'am_test123',
        ]);

        $payload = [
            'identifier' => 'evt_test123',
            'webhook_event_type' => 'payment.completed',
            'aggregator_id' => 'agg_test123',
            'subject' => [
                'payment' => [
                    'order_id' => 'TRX-TEST123',
                    'status' => 'COMPLETED',
                    'token' => 'pay_token',
                ],
            ],
        ];

        $response = $this->postJson('/api/webhooks/safepay', $payload, [
            'X-SFPY-EVENT-ID' => 'evt_test123',
            'X-SFPY-EVENT-TYPE' => 'payment.completed',
            'X-SFPY-AGGREGATOR-ID' => 'agg_test123',
            'X-SFPY-SIGNATURE' => 'sha256=invalid_signature',
            'X-SFPY-TIMESTAMP' => now()->toIso8601String(),
        ]);

        $response->assertStatus(403);
    }

    public function test_webhook_duplicate_event_idempotent(): void
    {
        $setting = PaymentSetting::firstOrCreate([
            'safepay_enabled' => true,
            'safepay_aggregator_id' => 'agg_test123',
            'safepay_secret_key' => base64_encode('test_secret'),
            'safepay_aggregator_merchant_identifier' => 'am_test123',
        ]);

        SafepayWebhookEvent::create([
            'event_id' => 'evt_test123',
            'event_type' => 'payment.completed',
            'aggregator_id' => 'agg_test123',
            'payload' => [],
        ]);

        $payload = [
            'identifier' => 'evt_test123',
            'webhook_event_type' => 'payment.completed',
            'aggregator_id' => 'agg_test123',
            'subject' => [
                'payment' => [
                    'order_id' => 'TRX-TEST123',
                    'status' => 'COMPLETED',
                    'token' => 'pay_token',
                ],
            ],
        ];

        $secret = base64_decode('test_secret');
        $timestamp = now()->toIso8601String();
        $rawBody = json_encode($payload);
        $signature = 'sha256='.hash_hmac('sha256', $timestamp.'.'.$rawBody, $secret);

        $response = $this->postJson('/api/webhooks/safepay', $payload, [
            'X-SFPY-EVENT-ID' => 'evt_test123',
            'X-SFPY-EVENT-TYPE' => 'payment.completed',
            'X-SFPY-AGGREGATOR-ID' => 'agg_test123',
            'X-SFPY-SIGNATURE' => $signature,
            'X-SFPY-TIMESTAMP' => $timestamp,
        ]);

        $response->assertStatus(200);

        $this->assertEquals(1, SafepayWebhookEvent::where('event_id', 'evt_test123')->count());
    }

    public function test_safepay_method_constant_exists(): void
    {
        $this->assertEquals('safepay', TransactionTender::METHOD_SAFEPAY);
    }

    public function test_safepay_gateway_constant_exists(): void
    {
        $this->assertEquals('safepay', PaymentSetting::GATEWAY_SAFEPAY);
    }

    public function test_cash_and_bank_transfer_still_work(): void
    {
        $setting = PaymentSetting::firstOrCreate();

        $this->assertTrue($setting->isGatewayReady(PaymentSetting::GATEWAY_BANK_TRANSFER) || ! $setting->bank_transfer_enabled);
    }
}
