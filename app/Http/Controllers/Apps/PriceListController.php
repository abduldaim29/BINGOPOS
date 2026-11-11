<?php

namespace App\Http\Controllers\Apps;

use App\Http\Controllers\Controller;
use App\Models\PriceList;
use App\Models\PriceListItem;
use App\Models\Product;
use App\Services\OutletAccessService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class PriceListController extends Controller
{
    public function __construct(private readonly OutletAccessService $outletAccess) {}

    public function index()
    {
        $outlet = $this->outletAccess->activeOutlet(request());
        $priceLists = PriceList::withCount('items')
            ->whereNull('outlet_id')->when($outlet, fn ($query) => $query->orWhere('outlet_id', $outlet->id))
            ->orderBy('priority')->get();

        return Inertia::render('Dashboard/Settings/PriceLists', [
            'priceLists' => $priceLists,
        ]);
    }

    public function show(PriceList $priceList)
    {
        abort_unless($this->canUseList($priceList), 404);
        $priceList->load('items.product:id,title,sku,sell_price,category_id', 'items.product.category:id,name');

        $products = Product::with('category:id,name')
            ->orderBy('category_id')
            ->orderBy('title')
            ->get(['id', 'title', 'sku', 'sell_price', 'category_id']);

        return Inertia::render('Dashboard/Settings/PriceListItems', [
            'priceList' => $priceList,
            'products' => $products,
        ]);
    }

    public function store(Request $request)
    {
        $existing = PriceList::where('slug', $request->input('slug'))->first();
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'slug' => ['required', 'string', 'max:100', Rule::unique('price_lists', 'slug')->ignore($existing?->id)],
            'customer_scope' => ['required', Rule::in(['all', 'walk_in', 'registered', 'member', 'segment'])],
            'customer_segment_id' => ['nullable', 'exists:customer_segments,id'],
            'priority' => ['integer', 'min:0'],
            'notes' => ['nullable', 'string', 'max:500'],
            'include_all_products' => ['boolean'],
        ]);
        if ($validated['customer_scope'] === 'segment' && empty($validated['customer_segment_id'])) {
            return back()->withErrors([
                'customer_segment_id' => 'Select a customer segment for segment pricing.',
            ])->withInput();
        }

        $outlet = $this->outletAccess->activeOutlet($request);
        DB::transaction(function () use ($validated, $existing, $outlet) {
            $priceList = $existing ?? new PriceList();
            $priceList->fill(collect($validated)->only([
                'name',
                'slug',
                'customer_scope',
                'customer_segment_id',
                'priority',
                'notes',
            ])->all());
            $priceList->is_active = true;
            if (! $existing) {
                $priceList->outlet_id = $outlet?->id;
            }
            $priceList->save();

            if (! empty($validated['include_all_products'])) {
                $priceList->items()->delete();

                Product::query()
                    ->select(['id', 'sell_price'])
                    ->orderBy('id')
                    ->chunkById(500, function ($products) use ($priceList) {
                        $now = now();
                        $items = $products->map(fn (Product $product) => [
                            'price_list_id' => $priceList->id,
                            'product_id' => $product->id,
                            'price' => $product->sell_price,
                            'created_at' => $now,
                            'updated_at' => $now,
                        ])->all();

                        if ($items !== []) {
                            PriceListItem::insert($items);
                        }
                    });
            }
        });

        return back()->with('success', $existing
            ? 'Price list updated successfully.'
            : 'Price list created successfully.');
    }

    public function update(Request $request, PriceList $priceList)
    {
        abort_unless($this->canUseList($priceList), 404);
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'slug' => ['required', 'string', 'max:100', Rule::unique('price_lists', 'slug')->ignore($priceList->id)],
            'customer_scope' => ['required', Rule::in(['all', 'walk_in', 'registered', 'member', 'segment'])],
            'customer_segment_id' => ['nullable', 'exists:customer_segments,id'],
            'is_active' => ['boolean'],
            'priority' => ['integer', 'min:0'],
            'notes' => ['nullable', 'string', 'max:500'],
        ]);
        if ($validated['customer_scope'] === 'segment' && empty($validated['customer_segment_id'])) {
            return back()->withErrors([
                'customer_segment_id' => 'Select a customer segment for segment pricing.',
            ])->withInput();
        }

        $priceList->update($validated);

        return back()->with('success', 'Price list updated successfully.');
    }

    public function destroy(PriceList $priceList)
    {
        abort_unless($this->canUseList($priceList), 404);
        $priceList->update(['is_active' => false]);

        return back()->with('success', 'Price list deactivated. Transaction history has been preserved.');
    }

    public function updateItem(Request $request, PriceList $priceList)
    {
        abort_unless($this->canUseList($priceList), 404);
        $request->validate([
            'product_id' => ['required', 'exists:products,id'],
            'price' => ['required', 'numeric', 'min:0'],
        ]);

        $priceList->items()->updateOrCreate(
            ['product_id' => $request->product_id],
            ['price' => $request->price]
        );

        return back()->with('success', 'Product price updated successfully.');
    }

    public function destroyItem(PriceList $priceList, $productId)
    {
        abort_unless($this->canUseList($priceList), 404);
        $priceList->items()->where('product_id', $productId)->delete();

        return back()->with('success', 'Item removed from price list successfully.');
    }

    private function canUseList(PriceList $priceList): bool
    {
        $outlet = $this->outletAccess->activeOutlet(request());

        return $priceList->outlet_id === null || ($outlet && (int) $priceList->outlet_id === (int) $outlet->id);
    }
}