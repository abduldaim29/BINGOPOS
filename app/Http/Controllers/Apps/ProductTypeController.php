<?php

namespace App\Http\Controllers\Apps;

use App\Http\Controllers\Controller;
use App\Models\ProductType;
use App\Models\Category;
use App\Models\Product;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Redirect;
use Inertia\Inertia;

class ProductTypeController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $productTypes = ProductType::when(request()->search, function ($query) {
            $query->where('name', 'like', '%'.request()->search.'%');
        })->latest()->paginate($this->perPage())->withQueryString();

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
        $products = Product::select('id', 'title')->get();

        return Inertia::render('Dashboard/ProductTypes/Create', [
            'categories' => $categories,
            'products' => $products,
        ]);
    }
    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'required|string|max:50|unique:product_types',
            'description' => 'nullable|string',
            'is_active' => 'nullable|boolean',
            'category_id' => 'nullable|exists:categories,id',
            'product_id' => 'nullable|exists:products,id',
        ]);

        ProductType::create([
            'name' => $request->name,
            'code' => $request->code,
            'description' => $request->description,
            'is_active' => $request->boolean('is_active', true),
            'category_id' => $request->category_id,
            'product_id' => $request->product_id,
        ]);

        return Redirect::route('product-types.index')->with('success', 'Item created successfully.');
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(ProductType $productType)
    {
        $categories = Category::select('id', 'name')->get();
        $products = Product::select('id', 'title')->get();

        return Inertia::render('Dashboard/ProductTypes/Edit', [
            'productType' => $productType,
            'categories' => $categories,
            'products' => $products,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, ProductType $productType): RedirectResponse
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'required|string|max:50|unique:product_types,code,'.$productType->id,
            'description' => 'nullable|string',
            'is_active' => 'nullable|boolean',
            'category_id' => 'nullable|exists:categories,id',
            'product_id' => 'nullable|exists:products,id',
        ]);

        $productType->update([
            'name' => $request->name,
            'code' => $request->code,
            'description' => $request->description,
            'is_active' => $request->boolean('is_active', true),
            'category_id' => $request->category_id,
            'product_id' => $request->product_id,
        ]);

        return Redirect::route('product-types.index')->with('success', 'Item updated successfully.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(ProductType $productType): RedirectResponse
    {
        $productType->delete();

        return Redirect::route('product-types.index')->with('success', 'Item deleted successfully.');
    }
}
