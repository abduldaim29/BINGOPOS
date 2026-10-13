<?php

namespace App\Services\Payments;

use App\Exceptions\PaymentGatewayException;
use App\Models\PaymentSetting;
use App\Models\Transaction;
use App\Models\TransactionTender;

class PaymentGatewayManager
{
    public function __construct(
        private MidtransGateway $midtransGateway,
        private XenditGateway $xenditGateway,
        private SafepayRaastGateway $safepayRaastGateway
    ) {}

    public function createPayment(Transaction $transaction, string $gateway, PaymentSetting $setting, ?int $amount = null, ?string $orderId = null): array
    {
        return match ($gateway) {
            PaymentSetting::GATEWAY_MIDTRANS => $this->midtransGateway->createCharge($transaction, $setting->midtransConfig(), $amount, $orderId),
            PaymentSetting::GATEWAY_XENDIT => $this->xenditGateway->createInvoice($transaction, $setting->xenditConfig(), $amount, $orderId),
            PaymentSetting::GATEWAY_SAFEPAY => $this->safepayRaastGateway->createDynamicQr($transaction, $setting->safepayConfig(), $amount, $orderId),
            default => throw new PaymentGatewayException("Gateway {$gateway} is not supported."),
        };
    }

    /**
     * Dynamic QRIS charge — uses whichever gateway is ready (Midtrans
     * preferred, Xendit as fallback). Returns reference/payment_url/qr_string.
     */
    public function createQrisPayment(Transaction $transaction, PaymentSetting $setting, ?int $amount = null, ?string $orderId = null): array
    {
        if ($setting->isGatewayReady(PaymentSetting::GATEWAY_MIDTRANS)) {
            return $this->midtransGateway->createQrisCharge($transaction, $setting->midtransConfig(), $amount, $orderId);
        }

        if ($setting->isGatewayReady(PaymentSetting::GATEWAY_XENDIT)) {
            return $this->xenditGateway->createQrisInvoice($transaction, $setting->xenditConfig(), $amount, $orderId);
        }

        throw new PaymentGatewayException('No active gateway is available for QRIS. Enable Midtrans or Xendit in the payment settings.');
    }

    /**
     * Charge a single tender. For split payments, the gateway amount must be
     * the tender amount and the orderId must be unique per transaction+tender,
     * so gateway webhooks do not mark the entire transaction as paid.
     */
    public function createTenderPayment(Transaction $transaction, TransactionTender $tender, PaymentSetting $setting): array
    {
        $orderId = $transaction->tenders()->count() > 1
            ? $transaction->invoice.'-'.$tender->method
            : $transaction->invoice;

        $response = $tender->method === TransactionTender::METHOD_QRIS
            ? $this->createQrisPayment($transaction, $setting, $tender->amount, $orderId)
            : $this->createPayment($transaction, $tender->method, $setting, $tender->amount, $orderId);

        return [
            'reference' => $response['reference'] ?? null,
            'payment_url' => $response['payment_url'] ?? null,
            'qr_string' => $response['qr_string'] ?? null,
        ];
    }
}