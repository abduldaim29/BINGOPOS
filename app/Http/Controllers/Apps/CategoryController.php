<?php

namespace App\Http\Controllers\Apps;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Services\ImageStorageService;
use App\Services\CategoryMergeService;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Inertia\Inertia;

class CategoryController extends Controller
{
    public function __construct(
        private readonly ImageStorageService $imageStorage,
        private readonly CategoryMergeService $categoryMergeService
    ) {}

    /**
     * Display a listing of the resource.
     *
     * @return Response
     */
    public function index()
    {
        $this->categoryMergeService->mergeDuplicates();

        // get categories
        $categories = Category::when(request()->search, function ($categories) {
            $categories = $categories->where('name', 'like', '%'.request()->search.'%');
        })->latest()->paginate($this->perPage())->withQueryString();

        // return inertia
        return Inertia::render('Dashboard/Categories/Index', [
            'categories' => $categories,
        ]);
    }

    /**
     * Show the form for creating a new resource.
     *
     * @return Response
     */
    public function create()
    {
        return Inertia::render('Dashboard/Categories/Create');
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
            'name' => 'required',
            'description' => 'required',
        ]);

        // upload image
        $image = $request->file('image');
        $imagePath = $this->imageStorage->store($image, 'category');

        // create category
        Category::create([
            'image' => $imagePath,
            'name' => $request->name,
            'description' => $request->description,
        ]);

        // redirect
        return to_route('categories.index');
    }

    /**
     * Show the form for editing the specified resource.
     *
     * @param  int  $id
     * @return Response
     */
    public function edit(Category $category)
    {
        return Inertia::render('Dashboard/Categories/Edit', [
            'category' => $category,
        ]);
    }

    /**
     * Update the specified resource in storage.
     *
     * @param  int  $id
     * @return Response
     */
    public function update(Request $request, Category $category)
    {
        /**
         * validate
         */
        $request->validate([
            'image' => 'nullable|image|mimes:jpeg,jpg,png,webp|max:2048',
            'name' => 'required',
            'description' => 'required',
        ]);

        // check image update
        if ($request->file('image')) {
            $oldImage = $category->getRawOriginal('image');
            $image = $request->file('image');
            $imagePath = $this->imageStorage->store($image, 'category');

            // update category with new image
            $category->update([
                'image' => $imagePath,
                'name' => $request->name,
                'description' => $request->description,
            ]);

            if ($oldImage) {
                $this->imageStorage->delete($oldImage, 'category');
            }
        } else {
            // update category without image
            $category->update([
                'name' => $request->name,
                'description' => $request->description,
            ]);
        }

        // redirect
        return Inertia::render('Dashboard/Categories/Edit', [
            'category' => $category->fresh(),
        ])->with('success', 'Category updated successfully');
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
        $category = Category::findOrFail($id);

        // remove image
        $image = $category->getRawOriginal('image');

        // delete
        $category->delete();

        if ($image) {
            $this->imageStorage->delete($image, 'category');
        }

        // redirect
        return to_route('categories.index');
    }
}