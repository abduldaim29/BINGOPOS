<?php

namespace App\Http\Middleware;

use App\Models\CashierShift;
use App\Models\DineOrder;
use App\Models\Outlet;
use App\Models\Payable;
use App\Models\Product;
use App\Models\ProductBatch;
use App\Models\Receivable;
use App\Models\Setting;
use App\Models\Transaction;
use App\Services\CashierShiftService;
use App\Services\OutletAccessService;
use App\Services\PayableAgingService;
use App\Services\ReceivableService;
use App\Support\ProductionSecurityBaseline;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    protected $rootView = 'app';

    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    public function share(Request $request): array
    {
        $lowStockNotifications = [];
        $expiringBatchNotifications = [];
        $receivableNotifications = [];
        $payableNotifications = [];
        $activeCashierShift = null;
        $securityWarnings = [];
        $stepUpFreshUntil = null;
        $payableAgingSummary = null;
        $receivableAgingSummary = null;
        $pendingApprovalCount = 0;
        $pendingDineOrdersCount = 0;
        $activeShift = null;
        $activeOutlet = null;
        $availableOutlets = collect();

        // Only load heavy data on dashboard route, not on every page
        $isDashboardRoute = $request->route()?->getName() === 'dashboard';

        if ($request->user()) {
            $userId = $request->user()->id;

            if ($request->user()->can('discounts-approve')) {
                $pendingApprovalCount = Transaction::where('discount_approval_status', 'pending')->count();
            }

            if ($request->user()->can('dine-orders-access')) {
                $pendingDineOrdersCount = DineOrder::pending()->count();
            }

            // Load active shift (needed for POS functionality)
            $activeShift = CashierShift::query()
                ->with('user:id,name', 'warehouse:id,code,name,outlet_id', 'warehouse.outlet')
                ->open()
                ->where('user_id', $userId)
                ->latest('opened_at')
                ->first();

            $outletAccess = app(OutletAccessService::class);
            $activeOutlet = $outletAccess->activeOutlet($request);
            $availableOutlets = $outletAccess->accessibleOutlets($request->user());

            if ($activeShift) {
                $activeCashierShift = app(CashierShiftService::class)->summarizeForDisplay($activeShift);
            }

            // Only load these heavy queries on dashboard
            if ($isDashboardRoute) {
                $warehouseIds = app(OutletAccessService::class)->warehousesFor($request->user())->pluck('id');
                $includeLegacy = Outlet::active()->count() <= 1;
                $lowStockNotifications = Product::query()
                    ->leftJoinSub(
                        DB::table('product_warehouse')
                            ->select('product_id', DB::raw('SUM(stock) as warehouse_stock'))
                            ->whereIn('warehouse_id', $warehouseIds)
                            ->groupBy('product_id'),
                        'warehouse_totals',
                        fn ($join) => $join->on('warehouse_totals.product_id', '=', 'products.id')
                    )
                    ->where('min_stock', '>', 0)
                    ->where(function ($query) use ($includeLegacy) {
                        $query->whereColumn('warehouse_totals.warehouse_stock', '<=', 'min_stock');
                        if ($includeLegacy) {
                            $query->orWhere(function ($legacy) {
                                $legacy->whereNull('warehouse_totals.warehouse_stock')
                                    ->whereColumn('stock', '<=', 'min_stock');
                            });
                        }
                    })
                    ->whereNotExists(function ($query) use ($userId) {
                        $query->selectRaw('1')
                            ->from('product_notification_reads as pr')
                            ->whereColumn('pr.product_id', 'products.id')
                            ->where('pr.user_id', $userId)
                            ->whereColumn('pr.updated_at', '>=', 'products.updated_at');
                    })
                    ->orderByDesc('updated_at')
                    ->limit(10)
                    ->get(['products.id', 'title', DB::raw('COALESCE(warehouse_totals.warehouse_stock, products.stock) as warehouse_stock'), 'updated_at'])
                    ->map(function ($product) {
                        return [
                            'id' => $product->id,
                            'title' => $product->title,
                            'stock' => (int) $product->warehouse_stock,
                            'time' => optional($product->updated_at)->diffForHumans(),
                        ];
                    });

                $expiringBatchNotifications = ProductBatch::with('product:id,title')
                    ->where('stock', '>', 0)
                    ->whereNotNull('expired_at')
                    ->whereBetween('expired_at', [now(), now()->addDays(30)])
                    ->orderBy('expired_at')
                    ->limit(10)
                    ->get()
                    ->map(function ($batch) {
                        return [
                            'id' => $batch->id,
                            'title' => $batch->product?->title,
                            'batch_number' => $batch->batch_number,
                            'stock' => (int) $batch->stock,
                            'time' => optional($batch->expired_at)->diffForHumans(),
                        ];
                    });

                $payableAgingService = new PayableAgingService;
                $receivableService = new ReceivableService;

                $payableAgingSummary = $payableAgingService->getAgingSummary();
                $receivableAgingSummary = $receivableService->getAgingSummary();

                $receivableNotifications = Receivable::whereNot('status', 'paid')
                    ->whereNotNull('due_date')
                    ->whereDate('due_date', '<=', now()->addDays(3))
                    ->orderBy('due_date')
                    ->limit(5)
                    ->get(['id', 'invoice', 'customer_id', 'due_date', 'total', 'paid', 'status'])
                    ->map(function ($item) {
                        $remaining = max(0, ($item->total ?? 0) - ($item->paid ?? 0));
                        $currencySymbol = Setting::getCurrencySymbol($outlet);

                        return [
                            'id' => $item->id,
                            'title' => "Accounts Receivable: {$item->invoice}",
                            'subtitle' => 'Remaining '.$currencySymbol.' '.number_format($remaining, 0, ',', '.'),
                            'time' => optional($item->due_date)->diffForHumans(),
                            'status' => $item->status,
                            'aging_bucket' => $item->aging_bucket,
                        ];
                    });

                $payableNotifications = Payable::whereNot('status', 'paid')
                    ->whereNotNull('due_date')
                    ->whereDate('due_date', '<=', now()->addDays(3))
                    ->orderBy('due_date')
                    ->limit(5)
                    ->get(['id', 'document_number', 'due_date', 'total', 'paid', 'status'])
                    ->map(function ($item) {
                        $remaining = max(0, ($item->total ?? 0) - ($item->paid ?? 0));
                        $currencySymbol = Setting::getCurrencySymbol($outlet);

                        return [
                            'id' => $item->id,
                            'title' => "Accounts Payable: {$item->document_number}",
                            'subtitle' => 'Remaining '.$currencySymbol.' '.number_format($remaining, 0, ',', '.'),
                            'time' => optional($item->due_date)->diffForHumans(),
                            'status' => $item->status,
                            'aging_bucket' => $item->aging_bucket,
                        ];
                    });
            }

            // Only check security warnings in production or on dashboard
            if (config('app.env') === 'production' || $isDashboardRoute) {
                $securityWarnings = ProductionSecurityBaseline::issues();
            }

            $confirmedAt = (int) $request->session()->get('auth.password_confirmed_at', 0);
            if ($confirmedAt > 0) {
                $stepUpFreshUntil = now()
                    ->setTimestamp($confirmedAt + (int) config('auth.password_timeout', 900))
                    ->toISOString();
            }
        }

        $storeProfile = [
            'name' => 'Your Store',
            'logo' => null,
            'address' => '',
            'phone' => '',
            'email' => '',
            'website' => '',
            'city' => '',
        ];
        $outlet = $activeShift?->warehouse?->outlet;
        if (! $outlet && $request->user()) {
            $outlet = app(OutletAccessService::class)->activeOutlet($request);
        }

        if (Schema::hasTable('settings')) {
            $settings = Setting::getManyForOutlet([
                'store_logo',
                'store_name',
                'store_address',
                'store_phone',
                'store_email',
                'store_website',
                'store_city',
                'printer_auto_print',
                'printer_paper_size',
                'currency_code',
                'currency_symbol',
                'currency_locale',
                'currency_decimal_places',
            ], $outlet, [
                'store_name' => 'Your Store',
                'store_address' => '',
                'store_phone' => '',
                'store_email' => '',
                'store_website' => '',
                'store_city' => '',
                'printer_auto_print' => '0',
                'printer_paper_size' => '80mm',
                'currency_code' => 'PKR',
                'currency_symbol' => 'Rs',
                'currency_locale' => 'en-PK',
                'currency_decimal_places' => '2',
            ]);
            $logo = $settings['store_logo'];
            if ($logo && ! str_starts_with($logo, 'http') && ! str_starts_with($logo, '/storage')) {
                $logo = asset('storage/'.ltrim($logo, '/'));
            }

            $storeProfile = [
                'name' => $settings['store_name'],
                'logo' => $logo,
                'address' => $settings['store_address'],
                'phone' => $settings['store_phone'],
                'email' => $settings['store_email'],
                'website' => $settings['store_website'],
                'city' => $settings['store_city'],
            ];

            $printerSettings = [
                'autoPrint' => filter_var($settings['printer_auto_print'], FILTER_VALIDATE_BOOL),
                'paperSize' => $settings['printer_paper_size'],
            ];

            $currencySettings = [
                'code' => $settings['currency_code'],
                'symbol' => $settings['currency_symbol'],
                'locale' => $settings['currency_locale'],
                'decimalPlaces' => (int) $settings['currency_decimal_places'],
            ];
        } else {
            $printerSettings = [
                'autoPrint' => false,
                'paperSize' => '80mm',
            ];

            $currencySettings = [
                'code' => 'PKR',
                'symbol' => 'Rs',
                'locale' => 'en-PK',
                'decimalPlaces' => 2,
            ];
        }

        return [
            ...parent::share($request),
            'auth' => [
                'user' => $request->user(),
                'permissions' => $request->user() ? $request->user()->getPermissions() : [],
                'super' => $request->user() ? $request->user()->isSuperAdmin() : false,
                'completedTours' => $request->user()?->completed_tours ?? [],
                'currentOutlet' => $activeOutlet?->only(['id', 'code', 'name']),
                'outlets' => $availableOutlets->map(fn (Outlet $outlet) => $outlet->only(['id', 'code', 'name']))->values(),
                'outletLocked' => (bool) $activeShift,
            ],
            'locale' => [
                'current' => app()->getLocale(),
                'available' => ['en', 'id'],
                'names' => [
                    'en' => 'English',
                    'id' => 'Indonesian',
                ],
            ],
            'lowStockNotifications' => $lowStockNotifications,
            'expiringBatchNotifications' => $expiringBatchNotifications,
            'receivableNotifications' => $receivableNotifications,
            'payableNotifications' => $payableNotifications,
            'payableAgingSummary' => $payableAgingSummary,
            'receivableAgingSummary' => $receivableAgingSummary,
            'activeCashierShift' => $activeCashierShift,
            'storeProfile' => $storeProfile,
            'printerSettings' => $printerSettings,
            'currencySettings' => $currencySettings,
            'pendingApprovalCount' => $pendingApprovalCount,
            'pendingDineOrdersCount' => $pendingDineOrdersCount,
            'appVersion' => config('app.version'),
            'security' => [
                'warnings' => $securityWarnings,
                'publicRegistrationEnabled' => config('security.auth.public_registration'),
                'stepUpFreshUntil' => $stepUpFreshUntil,
            ],
        ];
    }
}