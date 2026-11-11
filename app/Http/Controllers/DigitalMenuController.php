<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\Outlet;
use App\Models\Product;
use App\Models\Setting;
use App\Services\ImageStorageService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DigitalMenuController extends Controller
{
    public function __construct(
        private readonly ImageStorageService $imageStorage,
    ) {}

    public function index(Request $request)
    {
        $outlet = Outlet::query()
            ->active()
            ->when(
                $request->integer('outlet_id'),
                fn ($query, $outletId) => $query->whereKey($outletId)
            )
            ->orderBy('code')
            ->first();

        $categories = Category::query()
            ->with(['subCategories:id,category_id,name'])
            ->orderBy('name')
            ->get(['id', 'name', 'description', 'image']);

        $products = Product::query()
            ->whereHas('category')
            ->with([
                'category:id,name',
                'subCategory:id,category_id,name',
            ])
            ->orderBy('title')
            ->get([
                'id',
                'category_id',
                'sub_category_id',
                'title',
                'description',
                'image',
                'sell_price',
                'variations',
                'variation_prices',
            ])
            ->map(fn (Product $product) => [
                'id' => $product->id,
                'category_id' => $product->category_id,
                'sub_category_id' => $product->sub_category_id,
                'category_name' => $product->category?->name,
                'sub_category_name' => $product->subCategory?->name,
                'title' => $product->title,
                'description' => $product->description,
                'image' => $product->image,
                'sell_price' => (int) $product->sell_price,
                'variations' => $product->variations ?? [],
                'variation_prices' => $product->variation_prices ?? [],
            ])
            ->values();

        $settings = Setting::getManyForOutlet([
            'store_logo',
            'store_name',
            'store_address',
            'store_phone',
            'store_email',
            'store_website',
            'store_city',
        ], $outlet, [
            'store_name' => 'Your Store',
            'store_address' => '',
            'store_phone' => '',
            'store_email' => '',
            'store_website' => '',
            'store_city' => '',
        ]);

        $storeName = trim((string) ($settings['store_name'] ?? ''));
        if ($storeName === '' || strcasecmp($storeName, 'Toko Anda') === 0) {
            $storeName = 'Your Store';
        }

        $storeAddress = trim((string) ($settings['store_address'] ?? ''));
        if (strcasecmp($storeAddress, 'Alamat belum diisi') === 0) {
            $storeAddress = '';
        }

        return Inertia::render('Public/DigitalMenu', [
            'categories' => $categories,
            'products' => $products,
            'storeProfile' => [
                'name' => $storeName,
                'logo' => $this->imageStorage->url($settings['store_logo'], 'store'),
                'address' => $storeAddress,
                'phone' => $settings['store_phone'],
                'email' => $settings['store_email'],
                'website' => $settings['store_website'],
                'city' => $settings['store_city'],
            ],
        ]);
    }
}
