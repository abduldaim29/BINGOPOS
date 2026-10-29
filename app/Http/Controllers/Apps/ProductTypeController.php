<?php

namespace App\Http\Controllers\Apps;

use App\Http\Controllers\Controller;
use App\Models\ProductType;
use App\Models\Category;
use App\Models\Product;
use App\Models\Recipe;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Redirect;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class ProductTypeController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $productTypes = ProductType::with(['category:id,name', 'product:id,title'])
            ->when(request()->search, function ($query) {
            $query->where('name', 'like', '%'.request()->search.'%');
        })->orderBy('sort_order')->latest()->paginate($this->perPage())->withQueryString();

        return Inertia::render('Dashboard/ProductTypes/Index', [
            'productTypes' => $productTypes,
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        $categories = Category::select('id', 'name')->get();
        $products = Product::with('units:id,name,symbol')->select('id', 'title', 'buy_price')->orderBy('title')->get();

        return Inertia::render('Dashboard/ProductTypes/Create', [
            'categories' => $categories,
            'products' => $products,
            'ingredientProducts' => $products,
        ]);
    }
    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'short_name' => 'nullable|string|max:80',
            'code' => 'required|string|max:50|unique:product_types',
            'description' => 'nullable|string',
            'is_active' => 'nullable|boolean',
            'sort_order' => 'nullable|integer|min:0|max:999999',
            'color' => ['nullable', 'regex:/^#[0-9A-Fa-f]{6}$/'],
            'category_id' => 'nullable|exists:categories,id',
            'product_id' => 'nullable|exists:products,id',
            'ingredients' => 'nullable|array',
            'ingredients.*.product_id' => 'required|exists:products,id',
            'ingredients.*.unit_id' => 'nullable|exists:units,id',
            'ingredients.*.quantity' => 'required|numeric|gt:0',
            'ingredients.*.wastage_percent' => 'nullable|numeric|min:0|lt:100',
            'ingredients.*.purchase_price' => 'nullable|numeric|min:0',
        ]);
        $this->validateIngredientUnits($request->input('ingredients', []));

        DB::transaction(function () use ($request) {
            $item = ProductType::create([
                'name' => $request->name,
                'short_name' => $request->short_name,
                'code' => $request->code,
                'description' => $request->description,
                'is_active' => $request->boolean('is_active', true),
                'sort_order' => $request->integer('sort_order', 0),
                'color' => $request->color,
                'category_id' => $request->category_id,
                'product_id' => $request->product_id,
            ]);
            $this->syncItemRecipe($item, $request);
        });

        return Redirect::route('items.index')->with('success', 'Item created successfully.');
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(ProductType $productType)
    {
        $categories = Category::select('id', 'name')->get();
        $products = Product::with('units:id,name,symbol')->select('id', 'title', 'buy_price')->orderBy('title')->get();
        $productType->load(['recipe.ingredients.product:id,title,buy_price', 'recipe.ingredients.unit:id,name,symbol']);

        return Inertia::render('Dashboard/ProductTypes/Edit', [
            'productType' => $productType,
            'categories' => $categories,
            'products' => $products,
            'ingredientProducts' => $products,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, ProductType $productType): RedirectResponse
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'short_name' => 'nullable|string|max:80',
            'code' => 'required|string|max:50|unique:product_types,code,'.$productType->id,
            'description' => 'nullable|string',
            'is_active' => 'nullable|boolean',
            'sort_order' => 'nullable|integer|min:0|max:999999',
            'color' => ['nullable', 'regex:/^#[0-9A-Fa-f]{6}$/'],
            'category_id' => 'nullable|exists:categories,id',
            'product_id' => 'nullable|exists:products,id',
            'ingredients' => 'nullable|array',
            'ingredients.*.product_id' => 'required|exists:products,id',
            'ingredients.*.unit_id' => 'nullable|exists:units,id',
            'ingredients.*.quantity' => 'required|numeric|gt:0',
            'ingredients.*.wastage_percent' => 'nullable|numeric|min:0|lt:100',
            'ingredients.*.purchase_price' => 'nullable|numeric|min:0',
        ]);
        $this->validateIngredientUnits($request->input('ingredients', []));

        DB::transaction(function () use ($request, $productType) {
            $productType->update([
            'name' => $request->name,
            'short_name' => $request->short_name,
            'code' => $request->code,
            'description' => $request->description,
            'is_active' => $request->boolean('is_active', true),
            'sort_order' => $request->integer('sort_order', 0),
            'color' => $request->color,
            'category_id' => $request->category_id,
            'product_id' => $request->product_id,
            ]);
            $this->syncItemRecipe($productType, $request);
        });

        return Redirect::route('items.index')->with('success', 'Item updated successfully.');
    }

    private function syncItemRecipe(ProductType $item, Request $request): void
    {
        if (! $item->product_id) {
            $item->recipe()->update(['status' => 'inactive']);
            return;
        }

        $ingredients = collect($request->input('ingredients', []))
            ->filter(fn ($ingredient) => ! empty($ingredient['product_id']))
            ->values();
        if ($ingredients->contains(fn ($ingredient) => (int) $ingredient['product_id'] === (int) $item->product_id)) {
            abort(422, 'An item product cannot be used as its own ingredient.');
        }

        $recipe = $item->recipe ?: new Recipe();
        $recipe->product_type_id = $item->id;
        $recipe->product_id = $item->product_id;
        $recipe->fill([
            'code' => $recipe->code ?: 'ITEM-'.$item->code,
            'name' => $item->name.' Recipe',
            'recipe_type' => 'standard',
            'batch_yield' => 1,
            'status' => $item->is_active ? 'active' : 'inactive',
        ]);
        $recipe->save();
        $recipe->ingredients()->delete();
        $recipe->ingredients()->createMany($ingredients->map(fn ($ingredient) => [
            'product_id' => $ingredient['product_id'],
            'unit_id' => $ingredient['unit_id'] ?? null,
            'quantity' => $ingredient['quantity'],
            'wastage_percent' => $ingredient['wastage_percent'] ?? 0,
            'purchase_price' => $ingredient['purchase_price'] ?? null,
        ])->all());
    }

    private function validateIngredientUnits(array $ingredients): void
    {
        foreach ($ingredients as $index => $ingredient) {
            if (empty($ingredient['unit_id'])) {
                continue;
            }

            $valid = Product::whereKey($ingredient['product_id'] ?? 0)
                ->whereHas('units', fn ($query) => $query->whereKey($ingredient['unit_id']))
                ->exists();

            if (! $valid) {
                throw ValidationException::withMessages([
                    "ingredients.{$index}.unit_id" => 'The selected unit is not available for this ingredient product.',
                ]);
            }
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(ProductType $productType): RedirectResponse
    {
        $productType->delete();

        return Redirect::route('items.index')->with('success', 'Item deleted successfully.');
    }
}
