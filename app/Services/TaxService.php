<?php

namespace App\Services;

use App\Models\Setting;

class TaxService
{
    private float $defaultRate;

    public function __construct()
    {
        $this->defaultRate = (float) (Setting::get('tax_default_rate', '18.00'));
    }

    public function paymentRates(): array
    {
        return [
            'vat' => $this->defaultRate,
            'cash' => (float) Setting::get('tax_cash_rate', '16.00'),
            'card' => (float) Setting::get('tax_card_rate', '6.00'),
        ];
    }

    public function rateForPaymentMethod(?string $method): ?float
    {
        if ($method === null || $method === '') {
            return null;
        }

        return match (strtolower($method)) {
            'cash' => (float) Setting::get('tax_cash_rate', '16.00'),
            'card' => (float) Setting::get('tax_card_rate', '6.00'),
            default => $this->defaultRate,
        };
    }

    public function rateForTenders(array $tenders): ?float
    {
        $total = array_sum(array_map(
            static fn (array $tender): int => max(0, (int) ($tender['amount'] ?? 0)),
            $tenders
        ));

        if ($total === 0) {
            return null;
        }

        $weightedRate = 0.0;
        foreach ($tenders as $tender) {
            $amount = max(0, (int) ($tender['amount'] ?? 0));
            $rate = $this->rateForPaymentMethod($tender['method'] ?? null) ?? $this->defaultRate;
            $weightedRate += $amount * $rate;
        }

        return round($weightedRate / $total, 4);
    }

    public function getDefaultRate(): float
    {
        return $this->defaultRate;
    }

    public function calculateLineItem(int $lineTotal, string $taxType = 'exclusive', float $taxRate = 0): array
    {
        if ($taxRate <= 0) {
            return [
                'tax_amount' => 0,
                'tax_rate' => $taxRate,
                'taxable_amount' => $lineTotal,
                'line_total_before_tax' => $lineTotal,
                'line_total_after_tax' => $lineTotal,
            ];
        }

        if ($taxType === 'inclusive') {
            $taxAmount = (int) round($lineTotal - ($lineTotal / (1 + $taxRate / 100)));
            $beforeTax = $lineTotal - $taxAmount;
        } else {
            $taxAmount = (int) round($lineTotal * $taxRate / 100);
            $beforeTax = $lineTotal;
        }

        return [
            'tax_amount' => $taxAmount,
            'tax_rate' => $taxRate,
            'taxable_amount' => $beforeTax,
            'line_total_before_tax' => $beforeTax,
            'line_total_after_tax' => $beforeTax + $taxAmount,
        ];
    }

    public function calculateTransactionTax(array $items, float $defaultRate): array
    {
        $taxTotal = 0;
        $result = [];
        $rate = $defaultRate;

        foreach ($items as $item) {
            $lineTotal = (int) ($item['line_total'] ?? $item['price'] ?? 0);
            $itemTaxType = $item['tax_type'] ?? 'exclusive';
            $itemTaxRate = (float) ($item['tax_rate'] ?? $defaultRate);

            $taxResult = $this->calculateLineItem($lineTotal, $itemTaxType, $itemTaxRate);

            $taxTotal += $taxResult['tax_amount'];
            $result[] = [
                ...$item,
                ...$taxResult,
            ];

            if ($itemTaxRate > 0) {
                $rate = $itemTaxRate;
            }
        }

        return [
            'tax_total' => $taxTotal,
            'tax_rate' => $rate,
            'items' => $result,
        ];
    }
}