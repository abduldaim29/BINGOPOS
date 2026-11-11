<?php

namespace App\Http\Controllers\Apps;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use App\Services\AuditLogService;
use App\Services\ImageStorageService;
use App\Services\LoyaltyService;
use App\Services\OutletAccessService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SettingController extends Controller
{
    public function __construct(
        private readonly AuditLogService $auditLogService,
        private readonly ImageStorageService $imageStorage,
        private readonly LoyaltyService $loyaltyService,
        private readonly OutletAccessService $outletAccessService
    ) {}

    /**
     * Show the target settings page
     */
    public function target()
    {
        $outlet = $this->outletAccessService->activeOutlet(request());
        $settings = [
            'monthly_sales_target' => Setting::getForOutlet('monthly_sales_target', $outlet, 0),
        ];

        return Inertia::render('Dashboard/Settings/Target', [
            'settings' => $settings,
        ]);
    }

    /**
     * Update target settings
     */
    public function updateTarget(Request $request)
    {
        $request->validate([
            'monthly_sales_target' => 'required|numeric|min:0',
        ]);

        Setting::setForOutlet(
            'monthly_sales_target',
            $request->monthly_sales_target,
            $this->outletAccessService->activeOutlet($request),
            'Monthly sales target'
        );

        return back()->with('success', 'Target saved successfully');
    }

    /**
     * Store profile settings page
     */
    public function storeProfile()
    {
        $outlet = $this->outletAccessService->activeOutlet(request());
        $settings = [
            'store_name' => Setting::getForOutlet('store_name', $outlet, ''),
            'store_logo' => Setting::getForOutlet('store_logo', $outlet, ''),
            'store_address' => Setting::getForOutlet('store_address', $outlet, ''),
            'store_phone' => Setting::getForOutlet('store_phone', $outlet, ''),
            'store_email' => Setting::getForOutlet('store_email', $outlet, ''),
            'store_website' => Setting::getForOutlet('store_website', $outlet, ''),
            'store_city' => Setting::getForOutlet('store_city', $outlet, ''),
            'brand_ntn' => Setting::getForOutlet('brand_ntn', $outlet, ''),
            'brand_strn' => Setting::getForOutlet('brand_strn', $outlet, ''),
            'tax_default_rate' => Setting::get('tax_default_rate', '18.00'),
            'tax_cash_rate' => Setting::get('tax_cash_rate', '16.00'),
            'tax_card_rate' => Setting::get('tax_card_rate', '6.00'),
        ];

        return Inertia::render('Dashboard/Settings/Store', [
            'settings' => $settings,
        ]);
    }

    /**
     * Update store profile settings
     */
    public function updateStoreProfile(Request $request)
    {
        $outlet = $this->outletAccessService->activeOutlet($request);
        $request->validate([
            'store_name' => 'required|string|max:255',
            'store_address' => 'required|string|max:500',
            'store_phone' => 'nullable|string|max:50',
            'store_email' => 'nullable|email|max:255',
            'store_website' => 'nullable|string|max:255',
            'store_city' => 'nullable|string|max:255',
            'store_logo' => 'nullable|image|mimes:jpeg,jpg,png,webp|max:2048',
            'brand_ntn' => 'nullable|string|max:20',
            'brand_strn' => 'nullable|string|max:30',
            'tax_default_rate' => 'required|numeric|min:0|max:100',
            'tax_cash_rate' => 'required|numeric|min:0|max:100',
            'tax_card_rate' => 'required|numeric|min:0|max:100',
        ]);

        $before = [
            'store_name' => Setting::getForOutlet('store_name', $outlet, ''),
            'store_address' => Setting::getForOutlet('store_address', $outlet, ''),
            'store_phone' => Setting::getForOutlet('store_phone', $outlet, ''),
            'store_email' => Setting::getForOutlet('store_email', $outlet, ''),
            'store_website' => Setting::getForOutlet('store_website', $outlet, ''),
            'store_city' => Setting::getForOutlet('store_city', $outlet, ''),
            'brand_ntn' => Setting::getForOutlet('brand_ntn', $outlet, '') ? '***' : null,
            'brand_strn' => Setting::getForOutlet('brand_strn', $outlet, '') ? '***' : null,
            'tax_default_rate' => Setting::get('tax_default_rate', '18.00'),
            'tax_cash_rate' => Setting::get('tax_cash_rate', '16.00'),
            'tax_card_rate' => Setting::get('tax_card_rate', '6.00'),
            'store_logo_changed' => false,
        ];

        $logoPath = Setting::getForOutlet('store_logo', $outlet);
        $oldLogoPath = $logoPath;
        $logoChanged = false;

        if ($request->file('store_logo')) {
            $logoPath = $this->imageStorage->store($request->file('store_logo'), 'store');
            $logoChanged = true;
        }

        Setting::setForOutlet('store_name', $request->store_name, $outlet, 'Store name');
        Setting::setForOutlet('store_address', $request->store_address, $outlet, 'Store address');
        Setting::setForOutlet('store_phone', $request->store_phone, $outlet, 'Store phone');
        Setting::setForOutlet('store_email', $request->store_email, $outlet, 'Store email');
        Setting::setForOutlet('store_website', $request->store_website, $outlet, 'Store website');
        Setting::setForOutlet('store_city', $request->store_city, $outlet, 'Store city/district');
        Setting::setForOutlet('store_logo', $logoPath, $outlet, 'Store logo');
        Setting::setForOutlet('brand_ntn', $request->brand_ntn, $outlet, 'Brand NTN');
        Setting::setForOutlet('brand_strn', $request->brand_strn, $outlet, 'Brand STRN');
        Setting::set('tax_default_rate', $request->tax_default_rate, 'Default VAT rate (%)');
        Setting::set('tax_cash_rate', $request->tax_cash_rate, 'Cash payment VAT rate (%)');
        Setting::set('tax_card_rate', $request->tax_card_rate, 'Card payment VAT rate (%)');

        $this->auditLogService->log(
            event: 'store.setting.updated',
            module: 'store_settings',
            auditable: ['target_label' => 'Store Profile'],
            description: 'Store profile updated.',
            before: $before,
            after: [
                'store_name' => $request->store_name,
                'store_address' => $request->store_address,
                'store_phone' => $request->store_phone,
                'store_email' => $request->store_email,
                'store_website' => $request->store_website,
                'store_city' => $request->store_city,
                'store_logo_changed' => $logoChanged,
                'brand_ntn' => $request->brand_ntn ? '***' : null,
                'brand_strn' => $request->brand_strn ? '***' : null,
                'tax_default_rate' => $request->tax_default_rate,
                'tax_cash_rate' => $request->tax_cash_rate,
                'tax_card_rate' => $request->tax_card_rate,
            ],
        );

        if ($logoChanged && $oldLogoPath) {
            $this->imageStorage->delete($oldLogoPath, 'store');
        }

        return Inertia::render('Dashboard/Settings/Store', [
            'settings' => [
                'store_name' => Setting::getForOutlet('store_name', $outlet, ''),
                'store_logo' => Setting::getForOutlet('store_logo', $outlet, ''),
                'store_address' => Setting::getForOutlet('store_address', $outlet, ''),
                'store_phone' => Setting::getForOutlet('store_phone', $outlet, ''),
                'store_email' => Setting::getForOutlet('store_email', $outlet, ''),
                'store_website' => Setting::getForOutlet('store_website', $outlet, ''),
                'store_city' => Setting::getForOutlet('store_city', $outlet, ''),
                'brand_ntn' => Setting::getForOutlet('brand_ntn', $outlet, ''),
                'brand_strn' => Setting::getForOutlet('brand_strn', $outlet, ''),
                'tax_default_rate' => Setting::get('tax_default_rate', '18.00'),
                'tax_cash_rate' => Setting::get('tax_cash_rate', '16.00'),
                'tax_card_rate' => Setting::get('tax_card_rate', '6.00'),
            ],
        ])->with('success', 'Store profile updated successfully');
    }

    public function printer()
    {
        $outlet = $this->outletAccessService->activeOutlet(request());

        return Inertia::render('Dashboard/Settings/Printer', [
            'settings' => [
                'printer_auto_print' => Setting::getBoolForOutlet('printer_auto_print', $outlet, false),
                'printer_paper_size' => Setting::getForOutlet('printer_paper_size', $outlet, '80mm'),
            ],
        ]);
    }

    public function updatePrinter(Request $request)
    {
        $outlet = $this->outletAccessService->activeOutlet($request);
        $validated = $request->validate([
            'printer_auto_print' => ['boolean'],
            'printer_paper_size' => ['required', 'in:80mm,58mm'],
        ]);

        Setting::setForOutlet('printer_auto_print', $validated['printer_auto_print'] ? '1' : '0', $outlet, 'Auto-print receipt after transaction');
        Setting::setForOutlet('printer_paper_size', $validated['printer_paper_size'], $outlet, 'Thermal printer paper size');

        return back()->with('success', 'Printer settings saved.');
    }

    public function loyalty()
    {
        return Inertia::render('Dashboard/Settings/Loyalty', [
            'settings' => $this->loyaltyService->settingsPayload(),
        ]);
    }

    public function updateLoyalty(Request $request)
    {
        $validated = $request->validate([
            'enable_earn' => ['required', 'boolean'],
            'enable_redeem' => ['required', 'boolean'],
            'earn_rate_amount' => ['required', 'integer', 'min:1'],
            'redeem_point_value' => ['required', 'integer', 'min:1'],
            'tiers' => ['required', 'array'],
            'tiers.regular' => ['required', 'integer', 'min:0'],
            'tiers.silver' => ['required', 'integer', 'min:0'],
            'tiers.gold' => ['required', 'integer', 'min:0'],
            'tiers.platinum' => ['required', 'integer', 'min:0'],
        ]);

        $orderedThresholds = [
            'regular' => (int) $validated['tiers']['regular'],
            'silver' => (int) $validated['tiers']['silver'],
            'gold' => (int) $validated['tiers']['gold'],
            'platinum' => (int) $validated['tiers']['platinum'],
        ];

        if (
            $orderedThresholds['silver'] < $orderedThresholds['regular']
            || $orderedThresholds['gold'] < $orderedThresholds['silver']
            || $orderedThresholds['platinum'] < $orderedThresholds['gold']
        ) {
            return back()
                ->withErrors([
                    'tiers' => 'Tier thresholds must be ordered from Regular to Platinum.',
                ])
                ->withInput();
        }

        $before = $this->loyaltyService->settingsPayload();
        $this->loyaltyService->updateSettings([
            ...$validated,
            'tiers' => $orderedThresholds,
        ]);
        $this->loyaltyService->syncAllMemberTiers();

        $this->auditLogService->log(
            event: 'loyalty.setting.updated',
            module: 'loyalty_settings',
            auditable: ['target_label' => 'Loyalty Settings'],
            description: 'Loyalty settings updated.',
            before: $before,
            after: $this->loyaltyService->settingsPayload()
        );

        return back()->with('success', 'Loyalty settings saved successfully');
    }

}