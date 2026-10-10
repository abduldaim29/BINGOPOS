<?php

namespace App\Http\Controllers\Apps;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\Product;
use App\Models\SalesInvoice;
use App\Models\SalesInvoiceItem;
use App\Models\SalesInvoiceReceipt;
use App\Models\Setting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class SalesInvoiceController extends Controller
{
    public function index(Request $request)
    {
        $query = SalesInvoice::with(['customer', 'items', 'receipts'])
            ->orderBy('created_at', 'desc');

        if ($request->has('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        if ($request->has('search')) {
            $query->where('invoice_number', 'like', '%' . $request->search . '%')
                ->orWhereHas('customer', function ($q) use ($request) {
                    $q->where('name', 'like', '%' . $request->search . '%');
                });
        }

        $invoices = $query->paginate(15);

        return Inertia::render('Dashboard/SalesInvoices/Index', [
            'invoices' => $invoices,
            'filters' => $request->only(['status', 'search']),
        ]);
    }

    public function create()
    {
        return Inertia::render('Dashboard/SalesInvoices/Create', [
            'customers' => Customer::select('id', 'name')->get(),
            'products' => Product::select('id', 'title', 'sell_price')->get(),
            'invoiceNumber' => $this->generateInvoiceNumber(),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'customer_id' => 'nullable|exists:customers,id',
            'invoice_date' => 'required|date',
            'term_days' => 'nullable|integer|min:0',
            'salesperson' => 'nullable|string|max:255',
            'commission' => 'nullable|numeric|min:0',
            'subject' => 'nullable|string|max:255',
            'notes' => 'nullable|string',
            'remarks' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'nullable|exists:products,id',
            'items.*.description' => 'required|string',
            'items.*.unit' => 'nullable|string',
            'items.*.quantity' => 'required|numeric|min:0',
            'items.*.rate' => 'required|numeric|min:0',
            'items.*.discount_percent' => 'nullable|numeric|min:0|max:100',
            'items.*.tax_rate' => 'nullable|numeric|min:0|max:100',
        ]);

        DB::beginTransaction();
        try {
            $invoice = SalesInvoice::create([
                'invoice_number' => $validated['invoice_number'] ?? $this->generateInvoiceNumber(),
                'customer_id' => $validated['customer_id'],
                'invoice_date' => $validated['invoice_date'],
                'term_days' => $validated['term_days'] ?? 0,
                'due_date' => $validated['term_days'] ? date('Y-m-d', strtotime($validated['invoice_date'] . ' +' . $validated['term_days'] . ' days')) : null,
                'salesperson' => $validated['salesperson'],
                'commission' => $validated['commission'] ?? 0,
                'subject' => $validated['subject'],
                'notes' => $validated['notes'],
                'remarks' => $validated['remarks'],
                'status' => 'draft',
                'created_by' => auth()->id(),
            ]);

            $subtotal = 0;
            $totalTax = 0;

            foreach ($validated['items'] as $item) {
                $amount = $item['quantity'] * $item['rate'];
                $discountAmount = $amount * ($item['discount_percent'] ?? 0) / 100;
                $taxableAmount = $amount - $discountAmount;
                $taxAmount = $taxableAmount * ($item['tax_rate'] ?? 0) / 100;
                $netAmount = $taxableAmount + $taxAmount;

                SalesInvoiceItem::create([
                    'sales_invoice_id' => $invoice->id,
                    'product_id' => $item['product_id'],
                    'description' => $item['description'],
                    'unit' => $item['unit'],
                    'quantity' => $item['quantity'],
                    'rate' => $item['rate'],
                    'amount' => $amount,
                    'discount_percent' => $item['discount_percent'] ?? 0,
                    'discount_amount' => $discountAmount,
                    'tax_rate' => $item['tax_rate'] ?? 0,
                    'tax_amount' => $taxAmount,
                    'net_amount' => $netAmount,
                ]);

                $subtotal += $amount;
                $totalTax += $taxAmount;
            }

            $totalAmount = $subtotal - $invoice->discount_amount + $totalTax;

            $invoice->update([
                'subtotal' => $subtotal,
                'tax_amount' => $totalTax,
                'total_amount' => $totalAmount,
            ]);

            DB::commit();

            return redirect()->route('sales-invoices.index')->with('success', 'Invoice created successfully');
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->with('error', 'Failed to create invoice: ' . $e->getMessage());
        }
    }

    public function show(SalesInvoice $salesInvoice)
    {
        $salesInvoice->load(['customer', 'items.product', 'receipts.createdBy']);

        return Inertia::render('Dashboard/SalesInvoices/Show', [
            'invoice' => $salesInvoice,
        ]);
    }

    public function edit(SalesInvoice $salesInvoice)
    {
        $salesInvoice->load(['items', 'receipts']);

        return Inertia::render('Dashboard/SalesInvoices/Edit', [
            'invoice' => $salesInvoice,
            'customers' => Customer::select('id', 'name')->get(),
            'products' => Product::select('id', 'title', 'sell_price')->get(),
        ]);
    }

    public function update(Request $request, SalesInvoice $salesInvoice)
    {
        $validated = $request->validate([
            'customer_id' => 'nullable|exists:customers,id',
            'invoice_date' => 'required|date',
            'term_days' => 'nullable|integer|min:0',
            'salesperson' => 'nullable|string|max:255',
            'commission' => 'nullable|numeric|min:0',
            'subject' => 'nullable|string|max:255',
            'notes' => 'nullable|string',
            'remarks' => 'nullable|string',
            'status' => 'required|in:draft,sent,paid,overdue,cancelled',
            'items' => 'required|array|min:1',
            'items.*.id' => 'nullable|exists:sales_invoice_items,id',
            'items.*.product_id' => 'nullable|exists:products,id',
            'items.*.description' => 'required|string',
            'items.*.unit' => 'nullable|string',
            'items.*.quantity' => 'required|numeric|min:0',
            'items.*.rate' => 'required|numeric|min:0',
            'items.*.discount_percent' => 'nullable|numeric|min:0|max:100',
            'items.*.tax_rate' => 'nullable|numeric|min:0|max:100',
        ]);

        DB::beginTransaction();
        try {
            $salesInvoice->update([
                'customer_id' => $validated['customer_id'],
                'invoice_date' => $validated['invoice_date'],
                'term_days' => $validated['term_days'] ?? 0,
                'due_date' => $validated['term_days'] ? date('Y-m-d', strtotime($validated['invoice_date'] . ' +' . $validated['term_days'] . ' days')) : null,
                'salesperson' => $validated['salesperson'],
                'commission' => $validated['commission'] ?? 0,
                'subject' => $validated['subject'],
                'notes' => $validated['notes'],
                'remarks' => $validated['remarks'],
                'status' => $validated['status'],
            ]);

            $subtotal = 0;
            $totalTax = 0;

            foreach ($validated['items'] as $item) {
                $amount = $item['quantity'] * $item['rate'];
                $discountAmount = $amount * ($item['discount_percent'] ?? 0) / 100;
                $taxableAmount = $amount - $discountAmount;
                $taxAmount = $taxableAmount * ($item['tax_rate'] ?? 0) / 100;
                $netAmount = $taxableAmount + $taxAmount;

                if (isset($item['id'])) {
                    SalesInvoiceItem::where('id', $item['id'])->update([
                        'product_id' => $item['product_id'],
                        'description' => $item['description'],
                        'unit' => $item['unit'],
                        'quantity' => $item['quantity'],
                        'rate' => $item['rate'],
                        'amount' => $amount,
                        'discount_percent' => $item['discount_percent'] ?? 0,
                        'discount_amount' => $discountAmount,
                        'tax_rate' => $item['tax_rate'] ?? 0,
                        'tax_amount' => $taxAmount,
                        'net_amount' => $netAmount,
                    ]);
                } else {
                    SalesInvoiceItem::create([
                        'sales_invoice_id' => $salesInvoice->id,
                        'product_id' => $item['product_id'],
                        'description' => $item['description'],
                        'unit' => $item['unit'],
                        'quantity' => $item['quantity'],
                        'rate' => $item['rate'],
                        'amount' => $amount,
                        'discount_percent' => $item['discount_percent'] ?? 0,
                        'discount_amount' => $discountAmount,
                        'tax_rate' => $item['tax_rate'] ?? 0,
                        'tax_amount' => $taxAmount,
                        'net_amount' => $netAmount,
                    ]);
                }

                $subtotal += $amount;
                $totalTax += $taxAmount;
            }

            $totalAmount = $subtotal - $salesInvoice->discount_amount + $totalTax;

            $salesInvoice->update([
                'subtotal' => $subtotal,
                'tax_amount' => $totalTax,
                'total_amount' => $totalAmount,
            ]);

            DB::commit();

            return redirect()->route('sales-invoices.index')->with('success', 'Invoice updated successfully');
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->with('error', 'Failed to update invoice: ' . $e->getMessage());
        }
    }

    public function destroy(SalesInvoice $salesInvoice)
    {
        $salesInvoice->delete();

        return redirect()->route('sales-invoices.index')->with('success', 'Invoice deleted successfully');
    }

    public function addReceipt(Request $request, SalesInvoice $salesInvoice)
    {
        $validated = $request->validate([
            'receipt_date' => 'required|date',
            'bank' => 'nullable|string|max:255',
            'payment_mode' => 'required|string|max:255',
            'reference_number' => 'nullable|string|max:255',
            'amount' => 'required|numeric|min:0',
            'notes' => 'nullable|string',
        ]);

        $receipt = SalesInvoiceReceipt::create([
            'sales_invoice_id' => $salesInvoice->id,
            'receipt_date' => $validated['receipt_date'],
            'bank' => $validated['bank'],
            'payment_mode' => $validated['payment_mode'],
            'reference_number' => $validated['reference_number'],
            'amount' => $validated['amount'],
            'notes' => $validated['notes'],
            'created_by' => auth()->id(),
        ]);

        $totalPaid = $salesInvoice->receipts()->sum('amount');
        $salesInvoice->update(['paid_amount' => $totalPaid]);

        if ($totalPaid >= $salesInvoice->total_amount) {
            $salesInvoice->update(['status' => 'paid']);
        }

        return back()->with('success', 'Payment recorded successfully');
    }

    private function generateInvoiceNumber(): string
    {
        $prefix = 'INV-';
        $date = date('Ymd');
        $lastInvoice = SalesInvoice::where('invoice_number', 'like', $prefix . $date . '%')
            ->orderBy('invoice_number', 'desc')
            ->first();

        if ($lastInvoice) {
            $lastNumber = (int) str_replace($prefix . $date . '-', '', $lastInvoice->invoice_number);
            $newNumber = $lastNumber + 1;
        } else {
            $newNumber = 1;
        }

        return $prefix . $date . '-' . str_pad($newNumber, 4, '0', STR_PAD_LEFT);
    }
}
