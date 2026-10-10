<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Sales Invoice - {{ $invoice->invoice_number }}</title>
    <style>
        body {
            font-family: 'Arial', sans-serif;
            margin: 0;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .invoice-container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            padding: 40px;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
        }
        .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 40px;
            border-bottom: 2px solid #333;
            padding-bottom: 20px;
        }
        .logo {
            max-width: 150px;
            max-height: 80px;
        }
        .company-info h1 {
            margin: 0;
            color: #333;
            font-size: 24px;
        }
        .company-info p {
            margin: 5px 0;
            color: #666;
            font-size: 14px;
        }
        .invoice-title {
            text-align: right;
        }
        .invoice-title h2 {
            margin: 0;
            color: #333;
            font-size: 32px;
        }
        .invoice-title p {
            margin: 5px 0;
            color: #666;
            font-size: 14px;
        }
        .invoice-details {
            display: flex;
            justify-content: space-between;
            margin-bottom: 30px;
        }
        .bill-to, .invoice-info {
            width: 48%;
        }
        .section-title {
            font-weight: bold;
            color: #333;
            margin-bottom: 10px;
            font-size: 14px;
            text-transform: uppercase;
        }
        .customer-info p, .invoice-info p {
            margin: 5px 0;
            color: #666;
            font-size: 14px;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
        }
        th {
            background-color: #f8f9fa;
            border: 1px solid #dee2e6;
            padding: 12px;
            text-align: left;
            font-weight: bold;
            color: #333;
            font-size: 14px;
        }
        td {
            border: 1px solid #dee2e6;
            padding: 12px;
            color: #666;
            font-size: 14px;
        }
        .text-right {
            text-align: right;
        }
        .text-center {
            text-align: center;
        }
        .totals {
            margin-left: auto;
            width: 300px;
        }
        .totals table {
            margin-bottom: 0;
        }
        .totals td {
            padding: 8px 12px;
        }
        .totals .total-row td {
            font-weight: bold;
            background-color: #f8f9fa;
            font-size: 16px;
        }
        .notes-section {
            margin-bottom: 30px;
        }
        .notes-section p {
            margin: 5px 0;
            color: #666;
            font-size: 14px;
        }
        .receipts-section {
            margin-top: 30px;
            border-top: 1px solid #dee2e6;
            padding-top: 20px;
        }
        .receipts-section h3 {
            margin: 0 0 15px 0;
            color: #333;
            font-size: 16px;
        }
        .receipts-table th, .receipts-table td {
            padding: 8px;
            font-size: 13px;
        }
        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #dee2e6;
            text-align: center;
            color: #666;
            font-size: 12px;
        }
        .status-badge {
            display: inline-block;
            padding: 5px 15px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: bold;
            text-transform: uppercase;
        }
        .status-draft { background-color: #ffc107; color: #333; }
        .status-sent { background-color: #17a2b8; color: white; }
        .status-paid { background-color: #28a745; color: white; }
        .status-overdue { background-color: #dc3545; color: white; }
        .status-cancelled { background-color: #6c757d; color: white; }
    </style>
</head>
<body>
    <div class="invoice-container">
        <!-- Header -->
        <div class="header">
            <div class="company-info">
                @if($store['logo'])
                    <img src="{{ $store['logo'] }}" alt="Logo" class="logo">
                @endif
                <h1>{{ $store['name'] }}</h1>
                <p>{{ $store['address'] }}</p>
                <p>{{ $store['phone'] }}</p>
                @if($store['email'])
                    <p>{{ $store['email'] }}</p>
                @endif
            </div>
            <div class="invoice-title">
                <h2>INVOICE</h2>
                <p>{{ $invoice->invoice_number }}</p>
                <p>
                    <span class="status-badge status-{{ $invoice->status }}">
                        {{ ucfirst($invoice->status) }}
                    </span>
                </p>
            </div>
        </div>

        <!-- Customer & Invoice Details -->
        <div class="invoice-details">
            <div class="bill-to">
                <div class="section-title">Bill To:</div>
                @if($invoice->customer)
                    <div class="customer-info">
                        <p><strong>{{ $invoice->customer->name }}</strong></p>
                        @if($invoice->customer->address)
                            <p>{{ $invoice->customer->address }}</p>
                        @endif
                        @if($invoice->customer->phone)
                            <p>{{ $invoice->customer->phone }}</p>
                        @endif
                        @if($invoice->customer->email)
                            <p>{{ $invoice->customer->email }}</p>
                        @endif
                    </div>
                @else
                    <div class="customer-info">
                        <p><strong>Walk-in Customer</strong></p>
                    </div>
                @endif
            </div>
            <div class="invoice-info">
                <div class="section-title">Invoice Details:</div>
                <div class="invoice-info">
                    <p><strong>Date:</strong> {{ $invoice->invoice_date->format('F d, Y') }}</p>
                    @if($invoice->due_date)
                        <p><strong>Due Date:</strong> {{ $invoice->due_date->format('F d, Y') }}</p>
                    @endif
                    @if($invoice->salesperson)
                        <p><strong>Salesperson:</strong> {{ $invoice->salesperson }}</p>
                    @endif
                    @if($invoice->subject)
                        <p><strong>Subject:</strong> {{ $invoice->subject }}</p>
                    @endif
                </div>
            </div>
        </div>

        <!-- Items Table -->
        <table>
            <thead>
                <tr>
                    <th>Description</th>
                    <th class="text-center">Unit</th>
                    <th class="text-center">Qty</th>
                    <th class="text-right">Rate</th>
                    <th class="text-right">Amount</th>
                    <th class="text-right">Discount</th>
                    <th class="text-right">Tax</th>
                    <th class="text-right">Net</th>
                </tr>
            </thead>
            <tbody>
                @foreach($invoice->items as $item)
                    <tr>
                        <td>{{ $item->description }}</td>
                        <td class="text-center">{{ $item->unit ?? '-' }}</td>
                        <td class="text-center">{{ number_format($item->quantity, 2) }}</td>
                        <td class="text-right">{{ number_format($item->rate, 2) }}</td>
                        <td class="text-right">{{ number_format($item->amount, 2) }}</td>
                        <td class="text-right">{{ number_format($item->discount_amount, 2) }}</td>
                        <td class="text-right">{{ number_format($item->tax_amount, 2) }}</td>
                        <td class="text-right">{{ number_format($item->net_amount, 2) }}</td>
                    </tr>
                @endforeach
            </tbody>
        </table>

        <!-- Totals -->
        <div class="totals">
            <table>
                <tr>
                    <td>Subtotal:</td>
                    <td class="text-right">{{ number_format($invoice->subtotal, 2) }}</td>
                </tr>
                <tr>
                    <td>Discount:</td>
                    <td class="text-right">-{{ number_format($invoice->discount_amount, 2) }}</td>
                </tr>
                <tr>
                    <td>Tax:</td>
                    <td class="text-right">{{ number_format($invoice->tax_amount, 2) }}</td>
                </tr>
                <tr class="total-row">
                    <td>Total:</td>
                    <td class="text-right">{{ number_format($invoice->total_amount, 2) }}</td>
                </tr>
                <tr>
                    <td>Paid:</td>
                    <td class="text-right">{{ number_format($invoice->paid_amount, 2) }}</td>
                </tr>
                <tr class="total-row">
                    <td>Balance:</td>
                    <td class="text-right">{{ number_format($invoice->balance, 2) }}</td>
                </tr>
            </table>
        </div>

        <!-- Notes -->
        @if($invoice->notes)
            <div class="notes-section">
                <div class="section-title">Notes:</div>
                <p>{{ $invoice->notes }}</p>
            </div>
        @endif

        @if($invoice->remarks)
            <div class="notes-section">
                <div class="section-title">Remarks:</div>
                <p>{{ $invoice->remarks }}</p>
            </div>
        @endif

        <!-- Receipts -->
        @if($invoice->receipts->count() > 0)
            <div class="receipts-section">
                <h3>Payment History</h3>
                <table class="receipts-table">
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Bank</th>
                            <th>Mode</th>
                            <th>Reference</th>
                            <th class="text-right">Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        @foreach($invoice->receipts as $receipt)
                            <tr>
                                <td>{{ $receipt->receipt_date->format('F d, Y') }}</td>
                                <td>{{ $receipt->bank ?? '-' }}</td>
                                <td>{{ $receipt->payment_mode }}</td>
                                <td>{{ $receipt->reference_number ?? '-' }}</td>
                                <td class="text-right">{{ number_format($receipt->amount, 2) }}</td>
                            </tr>
                        @endforeach
                    </tbody>
                </table>
            </div>
        @endif

        <!-- Footer -->
        <div class="footer">
            <p>Thank you for your business!</p>
            <p>Generated on {{ now()->format('F d, Y h:i A') }}</p>
        </div>
    </div>
</body>
</html>
