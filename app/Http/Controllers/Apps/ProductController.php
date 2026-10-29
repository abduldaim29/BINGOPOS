<?php



namespace App\Http\Controllers\Apps;



use App\Http\Controllers\Controller;

use App\Models\Category;

use App\Models\Product;

use App\Models\ProductType;

use App\Models\ProductWarehouse;

use App\Models\SubCategory;

use App\Models\Unit;

use App\Models\Warehouse;

use App\Services\AuditLogService;

use App\Services\OutletAccessService;

use App\Services\StockMutationService;

use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

use Inertia\Inertia;



class ProductController extends Controller

{

    public function __construct(

        private readonly StockMutationService $stockMutationService,

        private readonly AuditLogService $auditLogService,

        private readonly OutletAccessService $outletAccessService

    ) {}



    /**

     * Display a listing of the resource.

     *

     * @return Response

     */

    public function index(Request $request)
    {
        $archived = $request->boolean('archived');
        $query = $archived ? Product::onlyTrashed() : Product::query();

        $products = $query->when($request->search, function ($products, $search) {
            $products = $products->where('title', 'like', '%'.$search.'%');
        })->with('category')->latest()->paginate($this->perPage())->withQueryString();



        $warehouses = $this->outletAccessService->warehousesFor($request->user());



        return Inertia::render('Dashboard/Products/Index', [
            'products' => $products,
            'warehouses' => $warehouses,
            'archived' => $archived,
            'archivedCount' => Product::onlyTrashed()->count(),
        ]);

    }



    /**

     * Show the form for creating a new resource.

     *

     * @return Response

     */

    public function create()

    {

        // get categories

        $categories = Category::all();



        // get product types

        $productTypes = ProductType::where('is_active', true)->get();



        // get non-composite products for composite component selection

        $products = Product::where('is_composite', false)

            ->orderBy('title')

            ->get(['id', 'title', 'sell_price', 'is_composite']);



        // return inertia

        return Inertia::render('Dashboard/Products/Create', [
            'categories' => $categories,
            'productTypes' => $productTypes,
            'products' => $products,
            'units' => Unit::orderBy('code')->get(['id', 'code', 'symbol']),
        ]);

    }



    /**

     * Store a newly created resource in storage.

     *

     * @return Response

     */

    public function store(Request $request)

    {

        /**

         * validate

         */

        $request->validate([

            'image' => 'required|image|mimes:jpeg,jpg,png,webp|max:2048',

            'barcode' => 'required|unique:products,barcode',

            'sku' => 'required|unique:products,sku',

            'title' => 'required',

            'description' => 'required',

            'category_id' => 'required',

            'product_type_id' => 'nullable|exists:product_types,id',

            'sub_category_id' => 'nullable|exists:sub_categories,id',

            'buy_price' => 'required',

            'sell_price' => 'required',

            'stock' => 'required|integer|min:0',

            'warehouse_id' => 'nullable|exists:warehouses,id',

            'min_stock' => 'nullable|integer|min:0',

            'max_stock' => 'nullable|integer|min:0',

            'tax_type' => 'nullable|in:exclusive,inclusive',

            'tax_rate' => 'nullable|numeric|min:0|max:100',

            'variations' => 'nullable|array',

            'variation_prices' => 'nullable|array',

            ...$this->compositeRules(),

            ...$this->unitRules(),

        ]);

        // upload image

        $image = $request->file('image');

        $image->storeAs('products', $image->hashName(), config('filesystems.image_disk', 'public'));



        // create product

        $product = Product::create([

            'image' => $image->hashName(),

            'barcode' => $request->barcode,

            'sku' => $request->sku,

            'title' => $request->title,

            'description' => $request->description,

            'category_id' => $request->category_id,

            'product_type_id' => $request->product_type_id,

            'sub_category_id' => $request->sub_category_id,

            'buy_price' => $request->buy_price,

            'sell_price' => $request->sell_price,

            'stock' => $request->stock,

            'min_stock' => $request->min_stock ?? 0,

            'max_stock' => $request->max_stock ?? 0,

            'tax_type' => $request->input('tax_type', 'exclusive'),

            'tax_rate' => $request->input('tax_rate', 18.00),

            'is_composite' => $request->boolean('is_composite'),

            'variations' => $request->input('variations'),

            'variation_prices' => $request->input('variation_prices'),

        ]);



        if ($request->boolean('is_composite')) {

            $this->validateComponentProducts($request);

            $this->syncComponents($product, $request->input('components'));

        } else {

            $this->syncUnits($product, $request->input('units'));



            // ponytail: keep global products.stock and per-warehouse pivot in sync; PUSAT (first active main) is the default warehouse

            $warehouse = Warehouse::find($request->warehouse_id)

                ?? Warehouse::active()->where('type', 'main')->orderBy('sort_order')->orderBy('code')->first()

                ?? Warehouse::active()->orderBy('sort_order')->orderBy('code')->first();



            abort_unless($this->outletAccessService->canUseWarehouse($request->user(), $warehouse), 403);



            if ($warehouse) {

                ProductWarehouse::updateOrCreate(

                    ['product_id' => $product->id, 'warehouse_id' => $warehouse->id],

                    ['stock' => (int) $request->stock]

                );

            }



            $this->stockMutationService->recordInitialStock($product, $request->user()?->id, $warehouse?->id);

        }

        $this->auditLogService->log(

            event: 'product.created',

            module: 'products',

            auditable: $product,

            description: 'New product created.',

            after: $this->productAuditPayload($product->fresh())

        );



        // redirect

        return to_route('products.index');

    }



    /**

     * Show the form for editing the specified resource.

     *

     * @param  int  $id

     * @return Response

     */

    public function edit(Product $product)

    {

        // get categories

        $categories = Category::all();



        // get product types

        $productTypes = ProductType::where('is_active', true)->get();



        // get sub categories for the product's category

        $subCategories = $product->category_id

            ? SubCategory::where('category_id', $product->category_id)->where('is_active', true)->get()

            : collect();



        // get non-composite products for composite component selection

        $products = Product::where('is_composite', false)

            ->where('id', '!=', $product->id)

            ->orderBy('title')

            ->get(['id', 'title', 'sell_price', 'is_composite']);



        return Inertia::render('Dashboard/Products/Edit', [

            'product' => $product->load('components', 'units'),

            'categories' => $categories,

            'productTypes' => $productTypes,

            'subCategories' => $subCategories,

            'products' => $products,

            'units' => Unit::orderBy('code')->get(['id', 'code', 'symbol']),

        ]);

    }



    /**

     * Update the specified resource in storage.

     *

     * @param  int  $id

     * @return Response

     */

    public function update(Request $request, Product $product)

    {

        $before = $this->productAuditPayload($product);



        /**

         * validate

         */

        $request->validate([

            'barcode' => 'nullable|unique:products,barcode,'.$product->id,

            'sku' => 'nullable|unique:products,sku,'.$product->id,

            'title' => 'required',

            'description' => 'required',

            'category_id' => 'required',

            'product_type_id' => 'nullable|exists:product_types,id',

            'sub_category_id' => 'nullable|exists:sub_categories,id',

            'buy_price' => 'required',

            'sell_price' => 'required',

            'min_stock' => 'nullable|integer|min:0',

            'max_stock' => 'nullable|integer|min:0',

            'tax_type' => 'nullable|in:exclusive,inclusive',

            'tax_rate' => 'nullable|numeric|min:0|max:100',

            'variations' => 'nullable|array',

            'variation_prices' => 'nullable|array',

            ...$this->compositeRules(),

            ...$this->unitRules(),

        ]);



        if ($request->boolean('is_composite')) {

            $this->validateComponentProducts($request, $product);

        } elseif ($request->boolean('is_composite') && empty($request->input('components'))) {

            return back()->withErrors([

                'components' => 'A composite product must have at least one component.',

            ]);

        }



        // check image update

        if ($request->file('image')) {



            // remove old image

            Storage::disk(config('filesystems.image_disk', 'public'))->delete('products/'.basename($product->image));



            // upload new image

            $image = $request->file('image');

            $image->storeAs('products', $image->hashName(), config('filesystems.image_disk', 'public'));



            // update product with new image

            $product->update([

                'image' => $image->hashName(),

                'barcode' => $request->barcode,

                'sku' => $request->sku,

                'title' => $request->title,

                'description' => $request->description,

                'category_id' => $request->category_id,

                'product_type_id' => $request->product_type_id,

                'sub_category_id' => $request->sub_category_id,

                'buy_price' => $request->buy_price,

                'sell_price' => $request->sell_price,

                'min_stock' => $request->min_stock ?? 0,

                'max_stock' => $request->max_stock ?? 0,

                'tax_type' => $request->input('tax_type', 'exclusive'),

                'tax_rate' => $request->input('tax_rate', 11.00),

                'is_composite' => $request->boolean('is_composite'),

                'variations' => $request->input('variations'),

                'variation_prices' => $request->input('variation_prices'),

            ]);



            if ($request->boolean('is_composite')) {

                $this->syncComponents($product, $request->input('components'));

            } else {

                $this->syncUnits($product, $request->input('units'));

            }



            $this->logProductUpdate($product, $before);



            return to_route('products.index');

        }



        // update product without image

        $product->update([

            'barcode' => $request->barcode,

            'sku' => $request->sku,

            'title' => $request->title,

            'description' => $request->description,

            'category_id' => $request->category_id,

            'product_type_id' => $request->product_type_id,

            'sub_category_id' => $request->sub_category_id,

            'buy_price' => $request->buy_price,

            'sell_price' => $request->sell_price,

            'min_stock' => $request->min_stock ?? 0,

            'max_stock' => $request->max_stock ?? 0,

            'tax_type' => $request->input('tax_type', 'exclusive'),

            'tax_rate' => $request->input('tax_rate', 11.00),

            'is_composite' => $request->boolean('is_composite'),

            'variations' => $request->input('variations'),

            'variation_prices' => $request->input('variation_prices'),

        ]);



        if ($request->boolean('is_composite')) {

            $this->syncComponents($product, $request->input('components'));

        } else {

            $this->syncUnits($product, $request->input('units'));

        }



        $this->logProductUpdate($product, $before);



        // redirect

        return to_route('products.index');

    }



    /**

     * Remove the specified resource from storage.

     *

     * @param  int  $id

     * @return Response

     */

    public function destroy($id)
    {
        // find by ID
        $product = Product::findOrFail($id);
        $before = $this->productAuditPayload($product);

        if ($product->carts()->exists()) {
            return back()->with('error', 'Remove this product from all active or held carts before archiving it.');
        }

        // Keep the image and historical product relationships for a possible restore.
        $product->delete();



        $this->auditLogService->log(
            event: 'product.archived',
            module: 'products',
            auditable: $product,
            description: 'Product archived.',
            before: $before,
            after: $before
        );

        // redirect

        return back()->with('success', 'Product archived successfully.');
    }

    public function restore($id)
    {
        $product = Product::withTrashed()->findOrFail($id);
        $product->restore();

        $this->auditLogService->log(
            event: 'product.restored',
            module: 'products',
            auditable: $product,
            description: 'Product restored.',
            after: $this->productAuditPayload($product)
        );

        return to_route('products.index')->with('success', 'Product restored successfully.');
    }

    public function forceDestroy($id)
    {
        $product = Product::withTrashed()->findOrFail($id);

        $blockingTables = [
            'transaction_details' => 'sales transaction history',
            'purchase_order_items' => 'purchase orders',
            'goods_receiving_items' => 'goods receiving history',
            'supplier_return_items' => 'supplier return history',
            'stock_transfer_items' => 'stock transfer history',
            'product_batches' => 'product batches',
        ];

        foreach ($blockingTables as $table => $label) {
            if (DB::table($table)->where('product_id', $product->id)->exists()) {
                return back()->with('error', "This product cannot be permanently deleted because it has {$label}. Keep it archived to preserve the records.");
            }
        }

        if ($product->carts()->exists()) {
            return back()->with('error', 'Remove this product from all active or held carts before permanently deleting it.');
        }

        if ($product->components()->exists() || $product->compositeOf()->exists()) {
            return back()->with('error', 'Remove this product from composite products before permanently deleting it.');
        }

        $before = $this->productAuditPayload($product);
        $image = $product->image;
        $product->forceDelete();

        if ($image) {
            Storage::disk(config('filesystems.image_disk', 'public'))->delete('products/'.basename($image));
        }

        $this->auditLogService->log(
            event: 'product.deleted',
            module: 'products',
            auditable: $product,
            description: 'Product permanently deleted.',
            before: $before
        );

        return to_route('products.index')->with('success', 'Product permanently deleted.');
    }



    private function compositeRules(): array

    {

        return [

            'is_composite' => 'nullable|boolean',

            'components' => 'nullable|array',

            'components.*.component_product_id' => 'required_if:is_composite,1,true|integer|distinct|exists:products,id',

            'components.*.qty' => 'required_if:is_composite,1,true|integer|min:1',

        ];

    }



    private function validateComponentProducts(Request $request, ?Product $product = null): void

    {

        $componentIds = collect($request->input('components'))

            ->pluck('component_product_id')

            ->unique();



        if ($product && $componentIds->contains($product->id)) {

            abort(422, 'A product cannot be a component of itself.');

        }



        $compositeCount = Product::whereIn('id', $componentIds)->where('is_composite', true)->count();



        if ($compositeCount > 0) {

            abort(422, 'A component cannot be another composite product.');

        }

    }



    private function syncComponents(Product $product, ?array $components): void

    {

        $product->components()->sync(

            collect($components)->mapWithKeys(fn (array $c) => [

                $c['component_product_id'] => ['qty' => (int) $c['qty']],

            ])

        );

    }



    private function unitRules(): array

    {

        return [

            'units' => 'nullable|array',

            'units.*.unit_id' => 'required|integer|distinct|exists:units,id',

            'units.*.is_base' => 'required|boolean',

            'units.*.conversion_factor' => 'required|numeric|min:0.0001',

            'units.*.buy_price' => 'nullable|integer|min:0',

            'units.*.sell_price' => 'nullable|integer|min:0',

            'units.*.barcode' => 'nullable|string|max:255',

        ];

    }



    private function syncUnits(Product $product, ?array $units): void

    {

        $rows = collect($units ?? [])

            ->keyBy('unit_id')

            ->map(fn (array $u) => [

                'is_base' => $u['is_base'],

                'conversion_factor' => $u['conversion_factor'],

                'buy_price' => $u['buy_price'] ?? $product->buy_price,

                'sell_price' => $u['sell_price'] ?? $product->sell_price,

                'barcode' => $u['barcode'] ?? null,

            ]);



        if ($rows->isEmpty()) {

            // ponytail: no units sent — only seed default PCS base when product has none (matches docs/features/unit-conversion.md)

            if ($product->units()->exists()) {

                return;

            }



            $pcs = Unit::where('code', 'PCS')->first();

            if ($pcs) {

                $product->units()->attach($pcs->id, [

                    'is_base' => true,

                    'conversion_factor' => 1,

                    'buy_price' => $product->buy_price,

                    'sell_price' => $product->sell_price,

                ]);

            }



            return;

        }



        if (! $rows->contains(fn ($r) => $r['is_base'])) {

            // ponytail: no explicit base unit sent — treat first row as base with factor 1

            $first = $rows->keys()->first();

            $rows[$first] = ['is_base' => true, 'conversion_factor' => 1] + $rows[$first];

        }



        $product->units()->sync($rows->all());

    }



    private function logProductUpdate(Product $product, array $before): void

    {

        $after = $this->productAuditPayload($product->fresh());



        $this->auditLogService->log(

            event: 'product.updated',

            module: 'products',

            auditable: $product,

            description: 'Product data updated.',

            before: $before,

            after: $after

        );



        if (

            (int) $before['buy_price'] !== (int) $after['buy_price']

            || (int) $before['sell_price'] !== (int) $after['sell_price']

        ) {

            $this->auditLogService->log(

                event: 'product.price_updated',

                module: 'products',

                auditable: $product,

                description: 'Product price updated.',

                before: [

                    'buy_price' => $before['buy_price'],

                    'sell_price' => $before['sell_price'],

                ],

                after: [

                    'buy_price' => $after['buy_price'],

                    'sell_price' => $after['sell_price'],

                ]

            );

        }

    }



    private function productAuditPayload(Product $product): array

    {

        return $this->auditLogService->only($product->toArray(), [

            'title',

            'barcode',

            'sku',

            'buy_price',

            'sell_price',

            'stock',

            'category_id',

        ]);

    }

}
