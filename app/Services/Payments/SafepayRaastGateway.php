<?php

namespace App\Services\Payments;

use App\Exceptions\PaymentGatewayException;
use App\Models\Transaction;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

class SafepayRaastGateway
{
    public function createDynamicQr(Transaction $transaction, array $config, ?int $amount = null, ?string $orderId = null): array
    {
        if (! ($config['enabled'] ?? false)) {
            throw new PaymentGatewayException('Safepay Raast is inactive or has not been configured.');
        }

        $endpoint = $config['is_production'] ?? false
            ? 'https://api.getsafepay.com/raastwire'
            : 'https://dev.api.getsafepay.com/raastwire';

        $aggregatorId = $config['aggregator_id'];
        $merchantIdentifier = $config['aggregator_merchant_identifier'];

        if (blank($aggregatorId) || blank($merchantIdentifier)) {
            throw new PaymentGatewayException('The Safepay aggregator ID or merchant identifier has not been configured.');
        }

        $url = "{$endpoint}/v1/aggregators/{$aggregatorId}/qrs";

        $customer = $transaction->customer;

        $payload = [
            'type' => 'DYNAMIC',
            'aggregator_merchant_identifier' => $merchantIdentifier,
            'request_id' => (string) Str::uuid(),
            'order_id' => $orderId ?? $transaction->invoice,
            'amount' => $this->convertToPaisa($amount ?? (int) $transaction->grand_total),
            'expiry_in_minutes' => 180,
        ];

        $response = Http::withHeaders([
            'X-SFPY-AGGREGATOR-SECRET-KEY' => $config['secret_key'],
            'Content-Type' => 'application/json',
        ])
            ->timeout(30)
            ->connectTimeout(10)
            ->post($url, $payload);

        if ($response->failed()) {
            $errorMessage = $response->json('message', $response->body());

            throw new PaymentGatewayException(
                'Safepay error: '.$errorMessage
            );
        }

        $data = $response->json('data');

        if (blank($data)) {
            throw new PaymentGatewayException('Invalid Safepay response: missing data field.');
        }

        $qrCode = $data['code'] ?? null;
        $qrToken = $data['token'] ?? null;

        if (blank($qrCode)) {
            throw new PaymentGatewayException('Invalid Safepay response: missing QR code.');
        }

        return [
            'reference' => $qrToken ?? $orderId ?? $transaction->invoice,
            'qr_string' => $qrCode,
            'token' => $qrToken,
            'raw' => $response->json(),
        ];
    }

    private function convertToPaisa(int $amountInRupees): int
    {
        return $amountInRupees * 100;
    }
}