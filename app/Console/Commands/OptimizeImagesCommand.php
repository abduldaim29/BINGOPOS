<?php

namespace App\Console\Commands;

use App\Models\Category;
use App\Models\Product;
use App\Models\Setting;
use App\Services\ImageStorageService;
use Illuminate\Console\Command;
use Illuminate\Database\Eloquent\Model;
use InvalidArgumentException;

class OptimizeImagesCommand extends Command
{
    protected $signature = 'images:optimize
        {--apply : Store optimized WebP images and update database paths}
        {--delete-originals : Delete source files that are no longer referenced (requires --apply)}';

    protected $description = 'Report or optimize stored product, category, and store images';

    public function handle(ImageStorageService $imageStorage): int
    {
        $apply = (bool) $this->option('apply');
        if ($this->option('delete-originals') && ! $apply) {
            $this->error('Use --delete-originals together with --apply.');

            return self::FAILURE;
        }

        $changed = 0;
        $skipped = 0;
        $bytesSaved = 0;
        $sourcePaths = [];

        $process = function (Model $model, string $attribute, string $folder) use (
            $imageStorage,
            $apply,
            &$changed,
            &$skipped,
            &$bytesSaved,
            &$sourcePaths
        ): void {
            $rawPath = $model->getRawOriginal($attribute);
            if (! is_string($rawPath) || trim($rawPath) === '') {
                return;
            }

            try {
                $path = $imageStorage->normalizePath($rawPath, $folder);
            } catch (InvalidArgumentException) {
                $skipped++;

                return;
            }

            $result = $imageStorage->optimizeStored($path, $folder, $apply);
            if (! $result['changed']) {
                return;
            }

            $changed++;
            $bytesSaved += $result['saved_bytes'];
            $sourcePaths[$path] = $folder;

            if ($apply) {
                $model->forceFill([$attribute => $result['path']])->saveOrFail();
            }

            $this->line(sprintf(
                '%s %s (%s saved)',
                $apply ? 'Optimized' : 'Would optimize',
                $path,
                $this->formatBytes($result['saved_bytes'])
            ));
        };

        Product::withTrashed()->whereNotNull('image')->chunkById(100, function ($products) use ($process) {
            foreach ($products as $product) {
                $process($product, 'image', 'products');
            }
        });

        Category::whereNotNull('image')->chunkById(100, function ($categories) use ($process) {
            foreach ($categories as $category) {
                $process($category, 'image', 'category');
            }
        });

        Setting::where('key', 'store_logo')->whereNotNull('value')->chunkById(100, function ($settings) use ($process) {
            foreach ($settings as $setting) {
                $process($setting, 'value', 'store');
            }
        });

        if ($apply && $this->option('delete-originals')) {
            $referencedPaths = $this->referencedPaths($imageStorage);
            $disk = \Illuminate\Support\Facades\Storage::disk(config('filesystems.image_disk', 'public'));

            foreach ($sourcePaths as $path => $folder) {
                if (! isset($referencedPaths[$path]) && $disk->exists($path)) {
                    $imageStorage->delete($path, $folder);
                }
            }
        }

        $this->newLine();
        $this->info(sprintf(
            '%s %d image(s); estimated savings: %s.%s',
            $apply ? 'Optimized' : 'Found',
            $changed,
            $this->formatBytes($bytesSaved),
            $skipped > 0 ? " Skipped {$skipped} external or invalid path(s)." : ''
        ));

        if (! $apply && $changed > 0) {
            $this->comment('Review the report, then run php artisan images:optimize --apply to write optimized files.');
        } elseif ($apply && ! $this->option('delete-originals') && $changed > 0) {
            $this->comment('Originals were kept for rollback. Run again with --apply --delete-originals to remove unreferenced originals.');
        }

        return self::SUCCESS;
    }

    private function referencedPaths(ImageStorageService $imageStorage): array
    {
        $paths = [];
        $collect = function (Model $model, string $attribute, string $folder) use ($imageStorage, &$paths): void {
            $value = $model->getRawOriginal($attribute);
            if (! is_string($value) || trim($value) === '') {
                return;
            }

            try {
                $paths[$imageStorage->normalizePath($value, $folder)] = true;
            } catch (InvalidArgumentException) {
                return;
            }
        };

        Product::withTrashed()->whereNotNull('image')->chunkById(100, function ($products) use ($collect) {
            foreach ($products as $product) {
                $collect($product, 'image', 'products');
            }
        });

        Category::whereNotNull('image')->chunkById(100, function ($categories) use ($collect) {
            foreach ($categories as $category) {
                $collect($category, 'image', 'category');
            }
        });

        Setting::where('key', 'store_logo')->whereNotNull('value')->chunkById(100, function ($settings) use ($collect) {
            foreach ($settings as $setting) {
                $collect($setting, 'value', 'store');
            }
        });

        return $paths;
    }

    private function formatBytes(int $bytes): string
    {
        return $bytes >= 1048576
            ? number_format($bytes / 1048576, 2).' MB'
            : number_format($bytes / 1024, 1).' KB';
    }
}
