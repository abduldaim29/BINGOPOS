<?php

namespace App\Services;

use App\Models\Category;
use Illuminate\Support\Facades\DB;

class CategoryMergeService
{
    public function normalize(string $name): string
    {
        $name = str_replace(['-', '–', '—', '_'], ' ', $name);

        return preg_replace('/\s+/', ' ', mb_strtolower(trim($name))) ?? '';
    }

    public function findOrCreate(string $name): Category
    {
        $name = trim($name) ?: 'General';
        $key = $this->normalize($name);

        $category = Category::query()
            ->orderBy('id')
            ->get()
            ->first(fn (Category $item): bool => $this->normalize($item->name) === $key);

        if ($category) {
            return $category;
        }

        return Category::create([
            'name' => $name,
            'description' => '',
            'image' => 'default.png',
        ]);
    }

    public function mergeDuplicates(): int
    {
        $merged = 0;

        DB::transaction(function () use (&$merged): void {
            $categories = Category::query()->orderBy('id')->get();
            $canonical = [];

            foreach ($categories as $category) {
                $key = $this->normalize($category->name);
                if (! isset($canonical[$key])) {
                    $canonical[$key] = $category;
                    continue;
                }

                $target = $canonical[$key];
                DB::table('products')->where('category_id', $category->id)->update(['category_id' => $target->id]);
                DB::table('sub_categories')->where('category_id', $category->id)->update(['category_id' => $target->id]);
                DB::table('pricing_rules')->where('category_id', $category->id)->update(['category_id' => $target->id]);
                DB::table('product_types')->where('category_id', $category->id)->update(['category_id' => $target->id]);
                $category->delete();
                $merged++;
            }
        });

        return $merged;
    }
}
