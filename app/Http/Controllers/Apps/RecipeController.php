<?php

namespace App\Http\Controllers\Apps;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\Recipe;
use App\Models\Unit;
use App\Services\RecipeCostingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class RecipeController extends Controller
{
    public function __construct(private readonly RecipeCostingService $costing) {}

    public function index(Request $request): Response
    {
        $recipes = Recipe::query()
            ->with(['product:id,title,sku,barcode', 'yieldUnit:id,name,symbol'])
            ->withCount('ingredients')
            ->when($request->input('search'), function ($query, $search) {
                $query->where(function ($builder) use ($search) {
                    $builder->where('name', 'like', "%{$search}%")
                        ->orWhere('code', 'like', "%{$search}%")
                        ->orWhereHas('product', fn ($product) => $product->where('title', 'like', "%{$search}%"));
                });
            })
            ->when($request->input('status'), fn ($query, $status) => $query->where('status', $status))
            ->latest()
            ->paginate($this->perPage())
            ->withQueryString();

        $recipes->getCollection()->transform(function (Recipe $recipe) {
            $recipe->costing = $this->costing->calculate($recipe);
            return $recipe;
        });

        return Inertia::render('Dashboard/Recipes/Index', [
            'recipes' => $recipes,
            'filters' => $request->only(['search', 'status']),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Dashboard/Recipes/Create', [
            'recipe' => null,
            'units' => Unit::query()->orderBy('name')->get(['id', 'name', 'symbol']),
            'productSearchUrl' => route('recipes.products.search'),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $this->validateRecipe($request);
        $recipe = DB::transaction(fn () => $this->saveRecipe(new Recipe(), $validated, $request));

        return to_route('recipes.index')->with('success', 'Recipe saved successfully.');
    }

    public function edit(Recipe $recipe): Response
    {
        $recipe->load(['product:id,title,sku,barcode,image,sell_price', 'yieldUnit:id,name,symbol', 'ingredients.product:id,title,sku,barcode,image,buy_price,stock', 'ingredients.unit:id,name,symbol', 'steps']);

        return Inertia::render('Dashboard/Recipes/Edit', [
            'recipe' => $recipe,
            'costing' => $this->costing->calculate($recipe),
            'units' => Unit::query()->orderBy('name')->get(['id', 'name', 'symbol']),
            'productSearchUrl' => route('recipes.products.search'),
        ]);
    }

    public function update(Request $request, Recipe $recipe): RedirectResponse
    {
        $validated = $this->validateRecipe($request, $recipe);
        DB::transaction(fn () => $this->saveRecipe($recipe, $validated, $request));

        return back()->with('success', 'Recipe updated successfully.');
    }

    public function destroy(Recipe $recipe): RedirectResponse
    {
        $recipe->delete();
        return to_route('recipes.index')->with('success', 'Recipe deleted successfully.');
    }

    public function duplicate(Recipe $recipe): RedirectResponse
    {
        $recipe->load(['ingredients', 'steps']);
        $copy = DB::transaction(function () use ($recipe) {
            $new = $recipe->replicate();
            $new->name = $recipe->name.' Copy';
            $new->code = $this->nextCode();
            $new->status = 'draft';
            $new->save();
            foreach ($recipe->ingredients as $ingredient) $new->ingredients()->create($ingredient->only(['product_id', 'unit_id', 'quantity', 'wastage_percent', 'purchase_price', 'purchase_price_source', 'purchase_tax_type', 'purchase_tax_rate', 'purchase_tax_included']));
            foreach ($recipe->steps as $step) $new->steps()->create($step->only(['sort_order', 'title', 'instructions', 'duration_minutes', 'temperature', 'temperature_unit', 'equipment']));
            return $new;
        });

        return to_route('recipes.edit', $copy)->with('success', 'Recipe duplicated as a draft.');
    }

    public function setStatus(Request $request, Recipe $recipe): RedirectResponse
    {
        $request->validate(['status' => ['required', 'in:draft,active,inactive']]);
        $recipe->update(['status' => $request->string('status')->toString()]);
        return back()->with('success', 'Recipe status updated.');
    }

    public function searchProducts(Request $request): JsonResponse
    {
        $search = trim((string) $request->input('search'));
        if ($search === '') return response()->json(['data' => []]);

        return response()->json([
            'data' => Product::query()
                ->where(function ($query) use ($search) {
                    $query->where('title', 'like', "%{$search}%")
                        ->orWhere('sku', 'like', "%{$search}%")
                        ->orWhere('barcode', 'like', "%{$search}%");
                })
                ->with(['category:id,name', 'units:id,name,symbol'])
                ->orderBy('title')
                ->limit(20)
                ->get(['id', 'title', 'sku', 'barcode', 'image', 'buy_price', 'sell_price', 'stock'])
                ->map(fn (Product $product) => [
                    ...$product->toArray(),
                    'base_unit' => $product->units->firstWhere('pivot.is_base', true)?->only(['id', 'name', 'symbol']),
                ]),
        ]);
    }

    private function validateRecipe(Request $request, ?Recipe $recipe = null): array
    {
        $validated = $request->validate([
            'product_id' => ['required', 'integer', 'exists:products,id'],
            'name' => ['required', 'string', 'max:255'],
            'recipe_type' => ['required', 'in:standard,batch,variation'],
            'batch_yield' => ['required', 'numeric', 'gt:0'],
            'yield_unit_id' => ['nullable', 'integer', 'exists:units,id'],
            'packaging_cost' => ['nullable', 'numeric', 'min:0'],
            'labour_cost' => ['nullable', 'numeric', 'min:0'],
            'overhead_cost' => ['nullable', 'numeric', 'min:0'],
            'notes' => ['nullable', 'string', 'max:5000'],
            'status' => ['required', 'in:draft,active,inactive'],
            'ingredients' => ['array'],
            'ingredients.*.ingredient_name' => ['required', 'string', 'max:255'],
            'ingredients.*.product_id' => ['nullable', 'integer', 'exists:products,id'],
            'ingredients.*.unit_id' => ['nullable', 'integer', 'exists:units,id'],
            'ingredients.*.quantity' => ['required', 'numeric', 'gt:0'],
            'ingredients.*.wastage_percent' => ['nullable', 'numeric', 'min:0', 'lt:100'],
            'ingredients.*.purchase_price' => ['required', 'numeric', 'min:0'],
            'steps' => ['array'],
            'steps.*.title' => ['required', 'string', 'max:255'],
            'steps.*.instructions' => ['required', 'string'],
            'steps.*.duration_minutes' => ['nullable', 'integer', 'min:0'],
            'steps.*.temperature' => ['nullable', 'numeric'],
            'steps.*.temperature_unit' => ['nullable', 'string', 'max:10'],
            'steps.*.equipment' => ['nullable', 'string', 'max:255'],
        ]);

        return $validated;
    }

    private function saveRecipe(Recipe $recipe, array $validated, Request $request): Recipe
    {
        $recipe->fill([
            'product_id' => $validated['product_id'],
            'name' => $validated['name'],
            'recipe_type' => $validated['recipe_type'],
            'batch_yield' => $validated['batch_yield'],
            'yield_unit_id' => $validated['yield_unit_id'] ?? null,
            'packaging_cost' => $validated['packaging_cost'] ?? 0,
            'labour_cost' => $validated['labour_cost'] ?? 0,
            'overhead_cost' => $validated['overhead_cost'] ?? 0,
            'notes' => $validated['notes'] ?? null,
            'status' => $validated['status'],
            'created_by' => $recipe->created_by ?: $request->user()?->id,
        ]);
        if (! $recipe->exists) $recipe->code = $this->nextCode();
        $recipe->save();
        $recipe->ingredients()->delete();
        $recipe->steps()->delete();
        foreach ($validated['ingredients'] ?? [] as $ingredient) {
            $recipe->ingredients()->create([
                ...$ingredient,
                'product_id' => null,
                'wastage_percent' => $ingredient['wastage_percent'] ?? 0,
                'purchase_price_source' => filled($ingredient['purchase_price'] ?? null) ? 'manual_override' : null,
                'purchase_tax_included' => false,
            ]);
        }
        foreach ($validated['steps'] ?? [] as $index => $step) {
            $recipe->steps()->create([...$step, 'sort_order' => $index]);
        }
        return $recipe;
    }

    private function nextCode(): string
    {
        do {
            $code = 'REC-'.now()->format('Ymd').'-'.Str::upper(Str::random(5));
        } while (Recipe::where('code', $code)->exists());
        return $code;
    }
}
