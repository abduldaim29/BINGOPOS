<?php



namespace App\Http\Controllers\Apps;



use App\Http\Controllers\Controller;

use App\Models\Category;

use App\Models\Product;

use App\Models\ProductType;

use App\Models\ProductWarehouse;
use App\Models\Recipe;

use App\Models\SubCategory;

use App\Models\Unit;

use App\Models\Warehouse;

use App\Services\AuditLogService;
use App\Services\ImageStorageService;
use App\Services\OutletAccessService;
use App\Services\RecipeCostingService;
use App\Services\StockMutationService;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

use Inertia\Inertia;



class ProductController extends Controller

{

    public function __construct(

        private readonly StockMutationService $stockMutationService,

        private readonly AuditLogService $auditLogService,

        private readonly OutletAccessService $outletAccessService,
        private readonly ImageStorageService $imageStorage,
        private readonly RecipeCostingService $recipeCosting

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
        })->with('category')
            ->latest()
            ->paginate($this->perPage())
            ->withQueryString()
            ->through(function (Product $product) {
                $product->setAttribute('is_live_cooking', $product->stock_mode === 'made_to_order');
                return $product;
            });



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

            ->with('units')

            ->orderBy('title')

            ->get(['id', 'title', 'sku', 'buy_price', 'sell_price', 'is_composite']);

        $basePurchaseCosts = $this->recipeCosting->basePurchaseCostsFor($products);
        $products->each(function (Product $ingredient) use ($basePurchaseCosts) {
            $ingredient->setAttribute('recipe_base_purchase_cost', $basePurchaseCosts[$ingredient->id]);
        });



        // return inertia

        return Inertia::render('Dashboard/Products/Create', [
            'categories' => $categories,
            'productTypes' => $productTypes,
            'products' => $products,
            'units' => Unit::orderBy('code')->get(['id', 'code', 'name', 'symbol']),
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

            'image' => 'nullable|image|mimes:jpeg,jpg,png,webp|max:2048',
            'image_url' => 'nullable|url|max:2048',

            'barcode' => 'required|unique:products,barcode',

            'sku' => 'required|unique:products,sku',

            'title' => 'required',

            'description' => 'nullable|string',

            'category_id' => 'required',

            'product_type_id' => 'nullable|exists:product_types,id',

            'sub_category_id' => 'nullable|exists:sub_categories,id',

            'buy_price' => 'nullable|numeric|min:0',

            'sell_price' => 'required',

            'stock' => 'nullable|integer|min:0',

            'stock_mode' => 'nullable|in:stock,made_to_order',

            'warehouse_id' => 'nullable|exists:warehouses,id',

            'min_stock' => 'nullable|integer|min:0',

            'max_stock' => 'nullable|integer|min:0',

            'tax_type' => 'nullable|in:exclusive,inclusive',

            'tax_rate' => 'nullable|numeric|min:0|max:100',

            'image_url' => 'nullable|url|max:2048',

            'variations' => 'nullable|array',

            'variations.*' => 'required|string|max:100',

            'variation_prices' => 'nullable|array',

            'variation_prices.*' => 'nullable|numeric|min:0',

            'variation_recipes' => 'nullable|array',

            'variation_recipes.*.batch_yield' => 'nullable|numeric|gt:0',

            'variation_recipes.*.packaging_cost' => 'nullable|numeric|min:0',

            'variation_recipes.*.labour_cost' => 'nullable|numeric|min:0',

            'variation_recipes.*.overhead_cost' => 'nullable|numeric|min:0',

            'variation_recipes.*.ingredients' => 'nullable|array',

            'variation_recipes.*.ingredients.*.product_id' => 'required|integer|exists:products,id',

            'variation_recipes.*.ingredients.*.ingredient_name' => 'nullable|string|max:255',

            'variation_recipes.*.ingredients.*.unit_id' => 'nullable|integer|exists:units,id',

            'variation_recipes.*.ingredients.*.quantity' => 'required|numeric|gt:0',

            'variation_recipes.*.ingredients.*.wastage_percent' => 'nullable|numeric|min:0|lt:100',

            'variation_recipes.*.ingredients.*.purchase_price' => 'nullable|numeric|min:0',

            ...$this->compositeRules(),

            ...$this->unitRules(),

        ]);

        // upload image

        $imagePath = $request->file('image')
            ? $this->imageStorage->store($request->file('image'), 'products')
            : ($request->input('image_url') ?: 'default.png');



        $product = DB::transaction(function () use ($request, $imagePath) {
            // create product
            $product = Product::create([

            'image' => $imagePath,

            'barcode' => $request->barcode,

            'sku' => $request->sku,

            'title' => $request->title,

            'description' => $request->input('description') ?? '',

            'category_id' => $request->category_id,

            'product_type_id' => $request->product_type_id,

            'sub_category_id' => $request->sub_category_id,

            'buy_price' => $request->input('buy_price') ?? 0,

            'sell_price' => $request->sell_price,

            'stock_mode' => $request->boolean('is_composite')
                ? 'stock'
                : $request->input('stock_mode', 'stock'),
            'stock' => $request->input('stock_mode') === 'made_to_order'
                ? 0
                : ($request->input('stock') ?? 0),

            'min_stock' => $request->min_stock ?? 0,

            'max_stock' => $request->max_stock ?? 0,

            'tax_type' => $request->input('tax_type') ?? 'exclusive',
            'tax_rate' => $request->input('tax_rate') ?? 18.00,

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
                        ['stock' => (int) $product->stock]
                    );

                }



                $this->stockMutationService->recordInitialStock($product, $request->user()?->id, $warehouse?->id);
            }

            $this->syncVariationRecipes($product, $request->input('variation_recipes', []), $request->user()?->id);

            return $product;
        });

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
        $product->setAttribute('is_live_cooking', $product->stock_mode === 'made_to_order');

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

            ->with('units')

            ->orderBy('title')

            ->get(['id', 'title', 'sku', 'buy_price', 'sell_price', 'is_composite']);

        $basePurchaseCosts = $this->recipeCosting->basePurchaseCostsFor($products);
        $products->each(function (Product $ingredient) use ($basePurchaseCosts) {
            $ingredient->setAttribute('recipe_base_purchase_cost', $basePurchaseCosts[$ingredient->id]);
        });

        $variationRecipes = Recipe::query()
            ->where('product_id', $product->id)
            ->whereNotNull('variation_id')
            ->with(['ingredients.product.units', 'ingredients.unit'])
            ->orderByDesc('id')
            ->get()
            ->unique('variation_id')
            ->mapWithKeys(fn (Recipe $recipe) => [
                (string) $recipe->variation_id => [
                    'batch_yield' => (string) $recipe->batch_yield,
                    'packaging_cost' => (string) $recipe->packaging_cost,
                    'labour_cost' => (string) $recipe->labour_cost,
                    'overhead_cost' => (string) $recipe->overhead_cost,
                    'ingredients' => $recipe->ingredients->map(fn ($ingredient) => [
                        'product_id' => $ingredient->product_id,
                        'ingredient_name' => $ingredient->ingredient_name ?: $ingredient->product?->title,
                        'unit_id' => $ingredient->unit_id,
                        'quantity' => (string) $ingredient->quantity,
                        'wastage_percent' => (string) $ingredient->wastage_percent,
                        'purchase_price' => $ingredient->purchase_price === null
                            ? ''
                            : (string) $ingredient->purchase_price,
                    ])->values()->all(),
                ],
            ]);



        return Inertia::render('Dashboard/Products/Edit', [
            'product' => $product->load('components', 'units'),
            'recipeCost' => $this->recipeCostForProduct($product),
            'variationRecipes' => $variationRecipes,

            'categories' => $categories,

            'productTypes' => $productTypes,

            'subCategories' => $subCategories,

            'products' => $products,

            'units' => Unit::orderBy('code')->get(['id', 'code', 'name', 'symbol']),

        ]);
    }

    public function recipeCost(Product $product): \Illuminate\Http\JsonResponse
    {
        return response()->json([
            'recipe' => $this->recipeCostForProduct($product),
        ]);
    }

    private function recipeCostForProduct(Product $product): ?array
    {
        $recipe = Recipe::query()
            ->where('product_id', $product->id)
            ->whereNull('variation_id')
            ->where('status', 'active')
            ->latest('id')
            ->first();

        if (! $recipe) {
            return null;
        }

        $costing = $this->recipeCosting->calculate($recipe);

        return [
            'id' => $recipe->id,
            'name' => $recipe->name,
            'code' => $recipe->code,
            'status' => $recipe->status,
            'batch_yield' => $costing['batch_yield'],
            'total_cost' => round($costing['total_cost'], 2),
            'cost_per_yield' => round($costing['cost_per_yield'], 2),
            'ingredient_count' => $costing['ingredient_count'],
            'packaging_cost' => round($costing['packaging_cost'], 2),
            'labour_cost' => round($costing['labour_cost'], 2),
            'overhead_cost' => round($costing['overhead_cost'], 2),
            'calculated_at' => now()->toISOString(),
        ];
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

            'description' => 'nullable|string',

            'category_id' => 'required',

            'product_type_id' => 'nullable|exists:product_types,id',

            'sub_category_id' => 'nullable|exists:sub_categories,id',

            'buy_price' => 'nullable|numeric|min:0',

            'sell_price' => 'required',

            'stock_mode' => 'nullable|in:stock,made_to_order',

            'min_stock' => 'nullable|integer|min:0',

            'max_stock' => 'nullable|integer|min:0',

            'tax_type' => 'nullable|in:exclusive,inclusive',

            'tax_rate' => 'nullable|numeric|min:0|max:100',

            'variations' => 'nullable|array',

            'variations.*' => 'required|string|max:100',

            'variation_prices' => 'nullable|array',

            'variation_prices.*' => 'nullable|numeric|min:0',

            'variation_recipes' => 'nullable|array',

            'variation_recipes.*.batch_yield' => 'nullable|numeric|gt:0',

            'variation_recipes.*.packaging_cost' => 'nullable|numeric|min:0',

            'variation_recipes.*.labour_cost' => 'nullable|numeric|min:0',

            'variation_recipes.*.overhead_cost' => 'nullable|numeric|min:0',

            'variation_recipes.*.ingredients' => 'nullable|array',

            'variation_recipes.*.ingredients.*.product_id' => 'required|integer|exists:products,id',

            'variation_recipes.*.ingredients.*.ingredient_name' => 'nullable|string|max:255',

            'variation_recipes.*.ingredients.*.unit_id' => 'nullable|integer|exists:units,id',

            'variation_recipes.*.ingredients.*.quantity' => 'required|numeric|gt:0',

            'variation_recipes.*.ingredients.*.wastage_percent' => 'nullable|numeric|min:0|lt:100',

            'variation_recipes.*.ingredients.*.purchase_price' => 'nullable|numeric|min:0',

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



        $oldImage = null;
        $attributes = [
            'barcode' => $request->barcode,
            'sku' => $request->sku,
            'title' => $request->title,
            'description' => $request->input('description') ?? '',
            'category_id' => $request->category_id,
            'product_type_id' => $request->product_type_id,
            'sub_category_id' => $request->sub_category_id,
            'buy_price' => $request->input('buy_price') ?? 0,
            'sell_price' => $request->sell_price,
            'stock_mode' => $request->boolean('is_composite')
                ? 'stock'
                : $request->input('stock_mode', 'stock'),
            'min_stock' => $request->min_stock ?? 0,
            'max_stock' => $request->max_stock ?? 0,
            'tax_type' => $request->input('tax_type') ?? 'exclusive',
            'tax_rate' => $request->input('tax_rate') ?? 18.00,
            'is_composite' => $request->boolean('is_composite'),
            'variations' => $request->input('variations'),
            'variation_prices' => $request->input('variation_prices'),
        ];

        if ($request->file('image')) {
            $oldImage = $product->getRawOriginal('image');
            $attributes['image'] = $this->imageStorage->store($request->file('image'), 'products');
        } else {
            $attributes['image'] = $request->filled('image_url')
                ? $request->input('image_url')
                : $product->getRawOriginal('image');
        }

        DB::transaction(function () use ($product, $request, $attributes) {
            $product->update($attributes);

            if ($request->boolean('is_composite')) {
                $this->syncComponents($product, $request->input('components'));
            } else {
                $this->syncUnits($product, $request->input('units'));
            }

            if ($request->exists('variation_recipes')) {
                $this->syncVariationRecipes(
                    $product,
                    $request->input('variation_recipes', []),
                    $request->user()?->id
                );
            } elseif ($request->exists('variations')) {
                $selectedVariationIds = array_map('strval', $product->variations ?? []);
                $deselectedRecipes = Recipe::query()
                    ->where('product_id', $product->id)
                    ->whereNotNull('variation_id')
                    ->where('status', '!=', 'inactive');

                if ($selectedVariationIds !== []) {
                    $deselectedRecipes->whereNotIn('variation_id', $selectedVariationIds);
                }

                $deselectedRecipes->update(['status' => 'inactive']);
            }
        });

        $this->logProductUpdate($product, $before);

        if ($oldImage) {
            $this->imageStorage->delete($oldImage, 'products');
        }



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

        if (DB::table('transaction_detail_recipe_consumptions')
            ->where('ingredient_product_id', $product->id)
            ->exists()) {
            return back()->with('error', 'This product cannot be permanently deleted because it has recipe inventory consumption history. Keep it archived to preserve the records.');
        }

        if ($product->carts()->exists()) {
            return back()->with('error', 'Remove this product from all active or held carts before permanently deleting it.');
        }

        if ($product->components()->exists() || $product->compositeOf()->exists()) {
            return back()->with('error', 'Remove this product from composite products before permanently deleting it.');
        }

        $before = $this->productAuditPayload($product);
        $image = $product->getRawOriginal('image');
        $product->forceDelete();

        if ($image) {
            $this->imageStorage->delete($image, 'products');
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



    private function syncVariationRecipes(Product $product, array $variationRecipes, ?int $userId): void
    {
        $selectedVariations = array_map('strval', $product->variations ?? []);
        $recipeVariationIds = array_map('strval', array_keys($variationRecipes));

        foreach ($recipeVariationIds as $variationId) {
            if (! in_array($variationId, $selectedVariations, true)) {
                throw ValidationException::withMessages([
                    'variation_recipes' => "Recipe variation [{$variationId}] is not selected for this product.",
                ]);
            }
        }

        $existingRecipes = Recipe::query()
            ->where('product_id', $product->id)
            ->whereNotNull('variation_id')
            ->orderByDesc('id')
            ->lockForUpdate()
            ->get()
            ->groupBy(fn (Recipe $recipe) => (string) $recipe->variation_id);

        foreach ($existingRecipes as $variationId => $recipes) {
            if (! in_array($variationId, $selectedVariations, true)) {
                foreach ($recipes as $recipe) {
                    if ($recipe->status !== 'inactive') {
                        $recipe->update(['status' => 'inactive']);
                    }
                }
            }
        }

        $ingredientProductIds = collect($variationRecipes)
            ->flatMap(fn ($recipe) => $recipe['ingredients'] ?? [])
            ->pluck('product_id')
            ->filter()
            ->unique()
            ->values();
        $ingredientProducts = Product::query()
            ->with('units')
            ->whereIn('id', $ingredientProductIds)
            ->get()
            ->keyBy('id');

        foreach ($variationRecipes as $variationId => $recipeData) {
            $variationId = (string) $variationId;
            $ingredients = $recipeData['ingredients'] ?? [];
            $recipes = $existingRecipes->get($variationId, collect());

            if (! count($ingredients)) {
                foreach ($recipes as $recipe) {
                    if ($recipe->status !== 'inactive') {
                        $recipe->update(['status' => 'inactive']);
                    }
                }
                continue;
            }

            foreach ($ingredients as $index => $ingredient) {
                $ingredientProduct = $ingredientProducts->get((int) $ingredient['product_id']);
                $unitId = $ingredient['unit_id'] ?? null;

                if (! $ingredientProduct || $ingredientProduct->is_composite) {
                    throw ValidationException::withMessages([
                        "variation_recipes.{$variationId}.ingredients.{$index}.product_id" =>
                            'Choose an existing non-composite inventory product.',
                    ]);
                }

                if ($unitId && ! $ingredientProduct->units->contains('id', (int) $unitId)) {
                    throw ValidationException::withMessages([
                        "variation_recipes.{$variationId}.ingredients.{$index}.unit_id" =>
                            'Choose a unit configured for this ingredient product. Configure a valid unit conversion before using other units.',
                    ]);
                }
            }

            $recipe = $recipes->first() ?? new Recipe();
            foreach ($recipes->skip(1) as $duplicate) {
                if ($duplicate->status !== 'inactive') {
                    $duplicate->update(['status' => 'inactive']);
                }
            }

            $variationName = Str::title(str_replace('_', ' ', preg_replace('/^[a-z]+_/', '', $variationId)));
            $recipe->fill([
                'product_id' => $product->id,
                'variation_id' => $variationId,
                'variation_name' => $variationName,
                'name' => $product->title.' - '.$variationName,
                'recipe_type' => 'variation',
                'batch_yield' => $recipeData['batch_yield'] ?? 1,
                'packaging_cost' => $recipeData['packaging_cost'] ?? 0,
                'labour_cost' => $recipeData['labour_cost'] ?? 0,
                'overhead_cost' => $recipeData['overhead_cost'] ?? 0,
                'status' => 'active',
                'created_by' => $recipe->created_by ?: $userId,
            ]);

            if (! $recipe->exists) {
                do {
                    $recipe->code = 'REC-'.now()->format('Ymd').'-'.Str::upper(Str::random(5));
                } while (Recipe::where('code', $recipe->code)->exists());
            }

            $recipe->save();
            $recipe->ingredients()->delete();

            foreach ($ingredients as $ingredient) {
                $ingredientProduct = $ingredientProducts->get((int) $ingredient['product_id']);
                $recipe->ingredients()->create([
                    'product_id' => $ingredientProduct->id,
                    'ingredient_name' => $ingredientProduct->title,
                    'unit_id' => $ingredient['unit_id'] ?: null,
                    'quantity' => $ingredient['quantity'],
                    'wastage_percent' => $ingredient['wastage_percent'] ?? 0,
                    'purchase_price' => ($ingredient['purchase_price'] ?? '') === ''
                        ? null
                        : $ingredient['purchase_price'],
                    'purchase_price_source' => ($ingredient['purchase_price'] ?? '') === ''
                        ? null
                        : 'manual_override',
                    'purchase_tax_included' => false,
                ]);
            }
        }
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
