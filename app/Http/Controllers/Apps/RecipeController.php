<?php

namespace App\Http\Controllers\Apps;

use App\Exports\RecipeTemplateExport;
use App\Http\Controllers\Controller;
use App\Imports\RecipePreviewImport;
use App\Models\Product;
use App\Models\Recipe;
use App\Models\Unit;
use App\Services\RecipeCostingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Maatwebsite\Excel\Facades\Excel;
use Inertia\Inertia;
use Inertia\Response;

class RecipeController extends Controller
{
    public function __construct(private readonly RecipeCostingService $costing) {}

    public function index(Request $request): Response
    {
        $recipes = Recipe::query()
            ->with(['product:id,title,sku,barcode,variations,variation_prices', 'yieldUnit:id,name,symbol'])
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

    public function previewImport(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'file' => ['required', 'file', 'mimes:xlsx,xls,csv', 'max:5120'],
        ]);

        $import = new RecipePreviewImport;
        $rows = Excel::toCollection($import, $validated['file'])->first() ?? collect();
        if ($rows->isEmpty()) {
            throw ValidationException::withMessages([
                'file' => 'The spreadsheet has no data rows. Use the recipe template and add recipe details.',
            ]);
        }

        if ($rows->count() > 500) {
            throw ValidationException::withMessages([
                'file' => 'A recipe import can contain at most 500 rows.',
            ]);
        }

        $recipeFields = [];
        $ingredients = [];
        $steps = [];

        foreach ($rows as $index => $row) {
            $row = collect($row)->map(fn ($value) => is_string($value) ? trim($value) : $value)->all();
            if (count(array_filter($row, fn ($value) => $value !== null && $value !== '')) === 0) {
                continue;
            }

            $recordType = strtolower((string) $this->rowValue($row, 'record_type', 'type'));
            if ($recordType === '') {
                $recordType = filled($this->rowValue($row, 'ingredient_name'))
                    ? 'ingredient'
                    : (filled($this->rowValue($row, 'step_title')) ? 'step' : 'recipe');
            }

            foreach ([
                'name' => ['recipe_name', 'name'],
                'finished_product' => ['finished_product', 'product', 'product_name'],
                'variation_id' => ['variation_id'],
                'variation_name' => ['variation_name', 'variation'],
                'recipe_type' => ['recipe_type'],
                'batch_yield' => ['batch_yield'],
                'yield_unit' => ['yield_unit', 'yield_unit_name'],
                'packaging_cost' => ['packaging_cost'],
                'labour_cost' => ['labour_cost'],
                'overhead_cost' => ['overhead_cost'],
                'notes' => ['notes'],
                'status' => ['status'],
            ] as $field => $aliases) {
                $value = $this->rowValue($row, ...$aliases);
                if ($value !== null && $value !== '') {
                    $recipeFields[$field] = $value;
                }
            }

            if ($recordType === 'ingredient') {
                $name = $this->rowValue($row, 'ingredient_name', 'ingredient');
                $quantity = $this->rowValue($row, 'ingredient_quantity', 'quantity');
                $purchasePrice = $this->rowValue($row, 'purchase_price', 'ingredient_cost');
                if (! filled($name) || ! is_numeric($quantity) || (float) $quantity <= 0
                    || ! is_numeric($purchasePrice) || (float) $purchasePrice < 0) {
                    throw ValidationException::withMessages([
                        'file' => 'Ingredient row '.($index + 2).' needs an ingredient name, a positive quantity, and a purchase price of zero or more.',
                    ]);
                }

                $unitValue = $this->rowValue($row, 'ingredient_unit', 'unit');
                $isDefaultIngredientUnit = $this->isDefaultUnitLabel($unitValue, 'base unit');
                $unit = $isDefaultIngredientUnit ? null : $this->resolveImportUnit($unitValue);
                if (filled($unitValue) && ! $unit && ! $isDefaultIngredientUnit) {
                    throw ValidationException::withMessages([
                        'file' => "Ingredient row ".($index + 2)." uses an unknown unit [{$unitValue}]. Use a unit name or symbol from the system.",
                    ]);
                }

                $wastage = $this->rowValue($row, 'wastage_percent', 'wastage');
                if ($wastage !== null && $wastage !== ''
                    && (! is_numeric($wastage) || (float) $wastage < 0 || (float) $wastage >= 100)) {
                    throw ValidationException::withMessages([
                        'file' => 'Ingredient row '.($index + 2).' has an invalid wastage percentage (must be from 0 to less than 100).',
                    ]);
                }

                $ingredients[] = [
                    'ingredient_name' => (string) $name,
                    'product_id' => null,
                    'unit_id' => $unit?->id ?? '',
                    'quantity' => (string) $quantity,
                    'wastage_percent' => (string) ($wastage ?? 0),
                    'purchase_price' => (string) $purchasePrice,
                ];
            } elseif ($recordType === 'step') {
                $title = $this->rowValue($row, 'step_title', 'title');
                $instructions = $this->rowValue($row, 'instructions', 'step_instructions');
                if (! filled($title) || ! filled($instructions)) {
                    throw ValidationException::withMessages([
                        'file' => 'Step row '.($index + 2).' needs both a step title and preparation instructions.',
                    ]);
                }

                $duration = $this->rowValue($row, 'duration_minutes', 'minutes');
                $temperature = $this->rowValue($row, 'temperature');
                if (($duration !== null && $duration !== '' && (! is_numeric($duration) || (int) $duration < 0))
                    || ($temperature !== null && $temperature !== '' && ! is_numeric($temperature))) {
                    throw ValidationException::withMessages([
                        'file' => 'Step row '.($index + 2).' has an invalid duration or temperature.',
                    ]);
                }

                $steps[] = [
                    'title' => (string) $title,
                    'instructions' => (string) $instructions,
                    'duration_minutes' => $duration === '' ? '' : ($duration ?? ''),
                    'temperature' => $temperature === '' ? '' : ($temperature ?? ''),
                    'temperature_unit' => (string) ($this->rowValue($row, 'temperature_unit') ?? 'C'),
                    'equipment' => (string) ($this->rowValue($row, 'equipment') ?? ''),
                ];
            } elseif ($recordType !== 'recipe') {
                throw ValidationException::withMessages([
                    'file' => 'Row '.($index + 2).' has an unsupported record_type. Use recipe, ingredient, or step.',
                ]);
            }
        }

        $recipeName = $recipeFields['name'] ?? null;
        $finishedProduct = $recipeFields['finished_product'] ?? null;
        if (! filled($recipeName) || ! filled($finishedProduct)) {
            throw ValidationException::withMessages([
                'file' => 'The recipe row needs both recipe_name and finished_product. Use an existing product name, SKU, or barcode.',
            ]);
        }

        $product = Product::query()
            ->where('title', $finishedProduct)
            ->orWhere('sku', $finishedProduct)
            ->orWhere('barcode', $finishedProduct)
            ->first(['id', 'title', 'sku', 'barcode', 'image', 'sell_price', 'variations', 'variation_prices']);

        $variationLabel = trim((string) ($recipeFields['variation_name'] ?? ''));
        if (! $product && str_contains($finishedProduct, ' - ')) {
            $separator = strrpos($finishedProduct, ' - ');
            $parentProduct = trim(substr($finishedProduct, 0, $separator));
            $variationLabel = $variationLabel ?: trim(substr($finishedProduct, $separator + 3));
            $product = Product::query()
                ->where(function ($query) use ($parentProduct) {
                    $query->where('title', $parentProduct)
                        ->orWhere('sku', $parentProduct)
                        ->orWhere('barcode', $parentProduct);
                })
                ->first(['id', 'title', 'sku', 'barcode', 'image', 'sell_price', 'variations', 'variation_prices']);
        }

        if (! $product) {
            throw ValidationException::withMessages([
                'file' => "Finished product [{$finishedProduct}] was not found. Use an existing product name, SKU, or barcode. For a variation, use the parent product and fill variation_id/variation_name.",
            ]);
        }

        $variationId = trim((string) ($recipeFields['variation_id'] ?? ''));
        $variationId = $variationId !== '' ? $variationId : null;
        $variationId = $this->resolveVariationId($product, $variationId, $variationLabel);
        if (($recipeFields['variation_id'] ?? null) !== null || $variationLabel !== '') {
            if (! $variationId) {
                throw ValidationException::withMessages([
                    'file' => "Variation [".($recipeFields['variation_id'] ?? $variationLabel)."] was not found on product [{$product->title}]. Use one of its configured variation IDs or names.",
                ]);
            }
        }
        $yieldUnitValue = $recipeFields['yield_unit'] ?? '';
        $isDefaultYieldUnit = $this->isDefaultUnitLabel($yieldUnitValue, 'serving / unit');
        $yieldUnit = $isDefaultYieldUnit ? null : $this->resolveImportUnit($yieldUnitValue);
        if (filled($yieldUnitValue) && ! $yieldUnit && ! $isDefaultYieldUnit) {
            throw ValidationException::withMessages([
                'file' => "Yield unit [{$yieldUnitValue}] was not found. Use a unit name or symbol from the system.",
            ]);
        }

        $recipeType = $variationId ? 'variation' : ($recipeFields['recipe_type'] ?? 'standard');
        $status = $recipeFields['status'] ?? 'draft';
        $batchYield = $recipeFields['batch_yield'] ?? 1;
        if (! in_array($recipeType, ['standard', 'batch', 'variation'], true)
            || ! in_array($status, ['draft', 'active', 'inactive'], true)
            || ! is_numeric($batchYield) || (float) $batchYield <= 0) {
            throw ValidationException::withMessages([
                'file' => 'Recipe type, status, or batch yield is invalid. Check the template values.',
            ]);
        }

        foreach (['packaging_cost', 'labour_cost', 'overhead_cost'] as $costField) {
            $value = $recipeFields[$costField] ?? 0;
            if (! is_numeric($value) || (float) $value < 0) {
                throw ValidationException::withMessages([
                    'file' => "The {$costField} value must be zero or more.",
                ]);
            }
        }

        return response()->json([
            'data' => [
                'product_id' => $product->id,
                'product' => $product,
                'variation_id' => $variationId ?? '',
                'variation_name' => $variationLabel ?: ($variationId ? $this->variationName($variationId) : ''),
                'name' => $recipeName,
                'recipe_type' => $recipeType,
                'batch_yield' => (string) $batchYield,
                'yield_unit_id' => $yieldUnit?->id ?? '',
                'packaging_cost' => (string) ($recipeFields['packaging_cost'] ?? 0),
                'labour_cost' => (string) ($recipeFields['labour_cost'] ?? 0),
                'overhead_cost' => (string) ($recipeFields['overhead_cost'] ?? 0),
                'notes' => (string) ($recipeFields['notes'] ?? ''),
                'status' => $status,
                'ingredients' => $ingredients,
                'steps' => $steps,
            ],
            'counts' => [
                'ingredients' => count($ingredients),
                'steps' => count($steps),
            ],
        ]);
    }

    public function downloadTemplate(Request $request)
    {
        if ($request->query('format') === 'csv') {
            return response()->streamDownload(function () {
                $stream = fopen('php://output', 'w');
                fputcsv($stream, (new RecipeTemplateExport)->headings());
                fclose($stream);
            }, 'recipe-template.csv', ['Content-Type' => 'text/csv; charset=UTF-8']);
        }

        return Excel::download(new RecipeTemplateExport, 'recipe-template.xlsx');
    }

    private function rowValue(array $row, string ...$keys): mixed
    {
        foreach ($keys as $key) {
            $value = $row[Str::snake($key)] ?? null;
            if ($value !== null && $value !== '') {
                return $value;
            }
        }

        return null;
    }

    private function isDefaultUnitLabel(mixed $value, string $defaultLabel): bool
    {
        return is_string($value)
            && Str::lower(preg_replace('/\s+/', ' ', trim($value))) === $defaultLabel;
    }

    private function resolveImportUnit(mixed $value): ?Unit
    {
        if (! is_string($value) || trim($value) === '') {
            return null;
        }

        $value = trim($value);
        $candidates = [$value];
        if (preg_match('/^(.+?)\s*\((.+?)\)$/', $value, $matches)) {
            $candidates[] = trim($matches[1]);
            $candidates[] = trim($matches[2]);
        }
        if (str_contains($value, '/')) {
            $candidates = [...$candidates, ...array_map('trim', explode('/', $value))];
        }

        $candidates = array_values(array_unique(array_filter($candidates)));

        return Unit::query()
            ->where(function ($query) use ($candidates) {
                foreach ($candidates as $candidate) {
                    $normalized = Str::lower($candidate);
                    $query->orWhereRaw('LOWER(name) = ?', [$normalized])
                        ->orWhereRaw('LOWER(symbol) = ?', [$normalized]);
                }
            })
            ->first();
    }

    private function resolveVariationId(Product $product, ?string $variationId, string $variationName): ?string
    {
        $variations = array_map('strval', $product->variations ?? []);
        if ($variationId !== null) {
            return in_array($variationId, $variations, true) ? $variationId : null;
        }

        if ($variationName === '') {
            return null;
        }

        $normalizedName = $this->normalizeVariationName($variationName);
        foreach ($variations as $candidate) {
            if ($this->normalizeVariationName($candidate) === $normalizedName) {
                return $candidate;
            }
        }

        return null;
    }

    private function normalizeVariationName(string $value): string
    {
        $value = preg_replace('/\s*\([^)]*\)\s*$/', '', trim($value));
        $value = preg_replace('/^[a-z]+_/', '', $value);

        return Str::lower(preg_replace('/[^a-z0-9]+/i', '', $value));
    }

    private function variationName(string $variationId): string
    {
        return Str::title(str_replace('_', ' ', preg_replace('/^[a-z]+_/', '', $variationId)));
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $this->validateRecipe($request);
        $recipe = DB::transaction(fn () => $this->saveRecipe(new Recipe(), $validated, $request));

        return to_route('recipes.show', $recipe)->with('success', 'Recipe saved successfully.');
    }

    public function show(Recipe $recipe): Response
    {
        $recipe->load([
            'product:id,title,sku,barcode,image,sell_price,variations,variation_prices',
            'yieldUnit:id,name,symbol',
            'ingredients.product:id,title,sku,barcode,image,buy_price,stock',
            'ingredients.unit:id,name,symbol',
            'steps',
        ]);

        return Inertia::render('Dashboard/Recipes/Show', [
            'recipe' => $recipe,
            'costing' => $this->costing->calculate($recipe),
        ]);
    }

    public function edit(Recipe $recipe): Response
    {
        $recipe->load(['product:id,title,sku,barcode,image,sell_price,variations,variation_prices', 'yieldUnit:id,name,symbol', 'ingredients.product:id,title,sku,barcode,image,buy_price,stock', 'ingredients.unit:id,name,symbol', 'steps']);

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
                ->get(['id', 'title', 'sku', 'barcode', 'image', 'buy_price', 'sell_price', 'stock', 'variations', 'variation_prices'])
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
            'variation_id' => ['nullable', 'string', 'max:100'],
            'variation_name' => ['nullable', 'string', 'max:100'],
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

        if (($validated['recipe_type'] ?? null) === 'variation') {
            $product = Product::query()->findOrFail($validated['product_id']);
            $variationId = $validated['variation_id'] ?? null;
            if (! $variationId || ! in_array($variationId, array_map('strval', $product->variations ?? []), true)) {
                throw ValidationException::withMessages([
                    'variation_id' => 'Select a variation available on the finished product.',
                ]);
            }
            $validated['variation_name'] = $this->variationName($variationId);
        } else {
            $validated['variation_id'] = null;
            $validated['variation_name'] = null;
        }

        return $validated;
    }

    private function saveRecipe(Recipe $recipe, array $validated, Request $request): Recipe
    {
        $recipe->fill([
            'product_id' => $validated['product_id'],
            'variation_id' => $validated['variation_id'] ?? null,
            'variation_name' => $validated['variation_name'] ?? null,
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
                'product_id' => $ingredient['product_id'] ?? null,
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
