@php
    $fontFamily = "'Inter', 'Helvetica', 'Arial', sans-serif";
    $storeName = $store['name'] === 'Toko Anda' ? 'Your Store' : $store['name'];
    $storeAddress = $store['address'] === 'Alamat belum diisi'
        ? 'Address not provided'
        : $store['address'];
@endphp
<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <title>{{ $storeName }} - Invoice {{ $transaction->invoice }}</title>
    <style>
        @font-face {
            font-family: 'Inter';
            font-style: normal;
            font-weight: 400;
            src: url("{{ public_path('inter/Inter_24pt-Regular.ttf') }}") format('truetype')
        }

        @font-face {
            font-family: 'Inter';
            font-style: normal;
            font-weight: 500;
            src: url("{{ public_path('inter/Inter_24pt-Medium.ttf') }}") format('truetype')
        }

        @font-face {
            font-family: 'Inter';
            font-style: normal;
            font-weight: 600;
            src: url("{{ public_path('inter/Inter_24pt-SemiBold.ttf') }}") format('truetype')
        }

        @font-face {
            font-family: 'Inter';
            font-style: normal;
            font-weight: 700;
            src: url("{{ public_path('inter/Inter_24pt-Bold.ttf') }}") format('truetype')
        }

        * {
            box-sizing: border-box
        }

        body {
            font-family: {{ $fontFamily }};
            margin: 0;
            padding: 24px;
            color: #0f172a
        }

        .header {
            margin-bottom: 5px
        }

        .store {
            display: flex;
            gap: 12px
        }

        .logo {
            width: 52px;
            height: 52px;
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden
        }

        .logo img {
            max-width: 100%;
            max-height: 100%;
            object-fit: contain
        }

        .badge {
            display: inline-block;
            padding: 4px 10px;
            border-radius: 999px;
            font-size: 12px;
            font-weight: 700;
            background: #e0f2fe;
            color: #0284c7
        }

        .qty {
            text-align: center;
            vertical-align: middle
        }

        table {
            width: 100%;
            border-collapse: separate;
            border-spacing: 0 10px;
            margin-top: 5px
        }

        th.produk,
        td.produk {
            text-align: left
        }

        thead th {
            background: #4aa377;
            color: #fff;
            font-size: 12px;
            font-weight: 700;
            text-transform: uppercase;
            padding: 12px 14px;
            border: none
        }

        thead th:first-child {
            border-radius: 7px 0 0 7px
        }

        thead th:last-child {
            border-radius: 0 7px 7px 0
        }

        tbody td {
            background: #f7f7f7
        }

        tbody tr td:first-child {
            border-radius: 8px 0 0 8px
        }

        tbody tr td:last-child {
            border-radius: 0 8px 8px 0
        }

        tbody tr:nth-child(even) td {
            background: #e6f3ec
        }

        tbody td {
            padding: 7px 14px 10px 14px;
            /* top | right | bottom | left */
            font-size: 13px;
            font-weight: 600;
            border: none
        }

        .right {
            text-align: right
        }

        .footer {
            margin-top: 20px;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 12px
        }

        .barcode {
            text-align: center
        }

        .barcode img {
            height: 28px
        }
    </style>

</head>

<body>
    <table class="header" style="width:100%; table-layout:fixed;">
        <td style="width:60%; vertical-align:top;">
            <div class="store">
                <div class="logo" style="width:60px;height:60px;">
                    @if ($store['logo_data'])
                        <img src="{{ $store['logo_data'] }}" alt="{{ $storeName }}">
                    @elseif($store['logo'])
                        <img src="{{ $store['logo'] }}" alt="{{ $storeName }}">
                    @else
                        <strong>{{ substr($storeName, 0, 2) }}</strong>
                    @endif
                </div>
                <div>
                    <h2 style="margin:0;">{{ $storeName }}</h2>
                    @if ($storeAddress)
                        <div style="font-size:12px;color:#475569; margin-top:2px;">{{ $storeAddress }}</div>
                    @endif
                    <div style="font-size:12px;color:#475569; margin-top:2px;">
                        {{ $store['phone'] ? 'Phone: ' . $store['phone'] . ' • ' : '' }}{{ $store['email'] }}
                    </div>
                </div>
            </div>
        </td>
        <td style="width:40%; vertical-align:middle; text-align:right;">
            <div class="badge">INVOICE</div>
            <div style="font-size:25px;font-weight:700; margin-top:8px;">{{ $transaction->invoice }}</div>
            <div style="font-size:12px;color:#475569; margin-top:6px;">
                {{ \Carbon\Carbon::parse($transaction->created_at)->format('d M Y H:i') }}
            </div>
        </td>
    </table>

    <table style="width:100%; margin-top:12px; table-layout:fixed;">
        <tr>
            <td style="width:50%; vertical-align:top; font-size:13px;">
                <div style="color:#64748b;font-weight:600;">Customer</div>
                <div style="font-weight:700; margin-top:2px;">{{ $transaction->customer->name ?? 'General' }}</div>
                @if ($transaction->customer?->no_telp)
                    <div style="color:#475569; margin-top:2px;">{{ $transaction->customer->no_telp }}</div>
                @endif
                @if ($transaction->customer)
                    <div style="color:#475569; margin-top:2px; font-size:12px;">
                        {{ $transaction->customer->village_name ?? '' }}

                        @if ($transaction->customer->regency_name)
                            , {{ $transaction->customer->regency_name }}
                        @endif
                        @if ($transaction->customer->province_name)
                            , {{ $transaction->customer->province_name }}
                        @endif
                    </div>
                @endif
            </td>
            <td style="width:50%; vertical-align:top; font-size:13px; text-align:right;">
                <div style="color:#64748b;font-weight:600;">Cashier</div>
                <div style="font-weight:700; margin-top:2px;">{{ $transaction->cashier->name ?? '-' }}</div>
                <div style="margin-top:6px;">
                    <div><strong>Status:</strong> {{ $transaction->payment_status }}</div>
                    <div><strong>Method:</strong> {{ $transaction->payment_method }}</div>
                    @if ($transaction->receivable && $transaction->receivable->due_date)
                        <div><strong>Due date:</strong> {{ $transaction->receivable->due_date }}</div>
                    @endif
                </div>
            </td>
        </tr>
    </table>

    <table>
        <thead>
            <tr>
                <th class="produk">Product Name</th>
                <th class="qty">Qty</th>
                <th class="right">Price</th>
                <th class="right">Subtotal</th>
            </tr>
        </thead>
        <tbody>
            @foreach ($transaction->details as $index => $detail)
                <tr style="background: {{ $index % 2 === 0 ? '#f8fafc' : '#fff' }};">
                    <td>
                        {{ $detail->product->title ?? 'Product' }}
                        @if ($detail->discount_total > 0 && ($detail->pricing_group_label || $detail->pricing_rule_name))
                            <div style="font-size:11px;color:#e11d48; margin-top:2px;">
                                Promotion: {{ $detail->pricing_group_label ?: $detail->pricing_rule_name }}
                            </div>
                        @endif
                    </td>
                    <td class="qty">{{ $detail->qty }}</td>
                    <td class="right">
                        @if ($detail->discount_total > 0 && $detail->base_unit_price > $detail->unit_price)
                            <div style="font-size:11px;color:#94a3b8;text-decoration:line-through;">
                                {{ number_format($detail->base_unit_price, 0, ',', ',') }}
                            </div>
                        @endif
                        {{ number_format($detail->unit_price ?: ($detail->price / max(1, $detail->qty)), 0, ',', ',') }}
                    </td>
                    <td class="right">{{ number_format($detail->price, 0, ',', ',') }}</td>
                </tr>
            @endforeach
        </tbody>
    </table>

    @php
        $promoDiscount = $transaction->details->sum('discount_total');
        $discount = $transaction->discount ?? 0;
        $voucherDiscount = $transaction->customer_voucher_discount ?? 0;
        $loyaltyDiscount = $transaction->loyalty_discount_total ?? 0;
        $shipping = $transaction->shipping_cost ?? 0;
        $grandTotal = $transaction->grand_total ?? 0;
        $subtotal = $grandTotal + $discount - $shipping + $promoDiscount + $voucherDiscount + $loyaltyDiscount;
    @endphp

    <table style="width:100%; margin-top:8px;">
        <tr>
            <td style="width:55%"></td>
            <td style="width:45%;">
                <table style="width:100%; border-collapse:separate; border-spacing:0 6px; font-size:12px;">
                    <tr>
                        <td style="color:#475569;">Subtotal</td>
                        <td class="right" style="font-weight:600;">
                            {{ number_format($subtotal, 0, ',', ',') }}
                        </td>
                    </tr>
                    <tr>
                        <td style="color:#475569;">Automatic Promotion</td>
                        <td class="right" style="font-weight:600;">
                            - {{ number_format($promoDiscount, 0, ',', ',') }}
                        </td>
                    </tr>
                    <tr>
                        <td style="color:#475569;">Manual Discount</td>
                        <td class="right" style="font-weight:600;">
                            - {{ number_format($discount, 0, ',', ',') }}
                        </td>
                    </tr>
                    @if ($voucherDiscount > 0)
                        <tr>
                            <td style="color:#475569;">Customer Voucher</td>
                            <td class="right" style="font-weight:600;">
                                - {{ number_format($voucherDiscount, 0, ',', ',') }}
                            </td>
                        </tr>
                    @endif
                    @if ($loyaltyDiscount > 0)
                        <tr>
                            <td style="color:#475569;">Redeem Points</td>
                            <td class="right" style="font-weight:600;">
                                - {{ number_format($loyaltyDiscount, 0, ',', ',') }}
                            </td>
                        </tr>
                    @endif
                    <tr>
                        <td style="color:#475569;">Shipping</td>
                        <td class="right" style="font-weight:600;">
                            + {{ number_format($shipping, 0, ',', ',') }}
                        </td>
                    </tr>
                    @if (($transaction->tax_total ?? 0) > 0)
                        <tr>
                            <td style="color:#475569;">VAT {{ number_format($transaction->tax_rate ?? 11, 0) }}%</td>
                            <td class="right" style="font-weight:600;">
                                + {{ number_format($transaction->tax_total, 0, ',', ',') }}
                            </td>
                        </tr>
                    @endif
                    <tr>
                        <td style="font-weight:700; font-size:13px;">Total</td>
                        <td class="right" style="font-weight:800; font-size:13px;">
                            {{ number_format($grandTotal, 0, ',', ',') }}
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>

    <div class="footer">
        <div class="barcode" style="margin-top: 15px">
            <img src="{{ $barcode }}" alt="barcode">
            <div style="font-size:10px;color:#475569;margin-top: 5px;">{{ $transaction->invoice }}</div>
        </div>
        <div style="font-size:11px;color:#94a3b8; text-align:center; margin-top: 20px;">
            Thank you for your trust.
        </div>
    </div>
</body>

</html>