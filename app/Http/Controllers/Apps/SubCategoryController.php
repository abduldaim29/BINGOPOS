<?php

namespace App\Http\Controllers\Apps;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\SubCategory;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Redirect;
use Inertia\Inertia;

class SubCategoryController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(): \Inertia\Response
    {
        $subCategories = SubCategory::with('category')
            ->when(request()->search, function ($query) {
                $query->where('name', 'like', '%'.request()->search.'%');
            })
            ->when(request()->category_id, function ($query) {
                $query->where('category_id', request()->category_id);
            })
            ->latest()
            ->paginate($this->perPage())
            ->withQueryString();

        $categories = Category::all();

        return Inertia::render('Dashboard/SubCategories/Index', [
            'subCategories' => $subCategories,
            'categories' => $categories,
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create(): \Inertia\Response
    {
        $categories = Category::all();

        return Inertia::render('Dashboard/SubCategories/Create', [
            'categories' => $categories,
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request): \Illuminate\Http\RedirectResponse
    {
        $request->validate([
            'category_id' => 'required|exists:categories,id',
            'name' => 'required|string|max:255',
            'code' => 'required|string|max:50|unique:sub_categories',
            'description' => 'nullable|string',
            'is_active' => 'nullable|boolean',
        ]);

        SubCategory::create([
            'category_id' => $request->category_id,
            'name' => $request->name,
            'code' => $request->code,
            'description' => $request->description,
            'is_active' => $request->boolean('is_active', true),
        ]);

        return Redirect::route('sub-categories.index')->with('success', 'Sub category created successfully.');
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(SubCategory $subCategory): \Inertia\Response
    {
        $categories = Category::all();

        return Inertia::render('Dashboard/SubCategories/Edit', [
            'subCategory' => $subCategory,
            'categories' => $categories,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, SubCategory $subCategory): \Illuminate\Http\RedirectResponse
    {
        $request->validate([
            'category_id' => 'required|exists:categories,id',
            'name' => 'required|string|max:255',
            'code' => 'required|string|max:50|unique:sub_categories,code,'.$subCategory->id,
            'description' => 'nullable|string',
            'is_active' => 'nullable|boolean',
        ]);

        $subCategory->update([
            'category_id' => $request->category_id,
            'name' => $request->name,
            'code' => $request->code,
            'description' => $request->description,
            'is_active' => $request->boolean('is_active', true),
        ]);

        return Redirect::route('sub-categories.index')->with('success', 'Sub category updated successfully.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(SubCategory $subCategory): \Illuminate\Http\RedirectResponse
    {
        $subCategory->delete();

        return Redirect::route('sub-categories.index')->with('success', 'Sub category deleted successfully.');
    }

    /**
     * Get subcategories by category for AJAX calls
     */
    public function getByCategory(Category $category): JsonResponse
    {
        $subCategories = SubCategory::where('category_id', $category->id)
            ->where('is_active', true)
            ->get(['id', 'name', 'code']);

        return response()->json($subCategories);
    }
}
