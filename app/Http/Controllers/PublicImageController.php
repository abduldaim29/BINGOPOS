<?php

namespace App\Http\Controllers;

use Illuminate\Support\Facades\Storage;
use App\Services\ImageStorageService;

class PublicImageController extends Controller
{
    public function show(string $path, ImageStorageService $imageStorage)
    {
        $segments = explode('/', $path);
        abort_unless(
            in_array($segments[0], ['products', 'category', 'store'], true)
                && count($segments) > 1
                && ! in_array('', $segments, true)
                && ! in_array('.', $segments, true)
                && ! in_array('..', $segments, true)
                && ! str_contains($path, '\\')
                && ! str_contains($path, "\0"),
            404
        );

        if (request()->query('size') === 'pos' && $segments[0] === 'products') {
            $path = $imageStorage->productThumbnailPath($path);
        }

        $diskName = config('filesystems.image_disk', 'public');
        $disk = Storage::disk($diskName);
        abort_unless($disk->exists($path), 404);

        // Remove buffered whitespace so the response starts with the image's actual bytes.
        if (ob_get_level() > 0 && trim((string) ob_get_contents()) === '') {
            ob_clean();
        }

        if (config("filesystems.disks.{$diskName}.driver") === 'local') {
            return response()->file($disk->path($path))
                ->setPublic()
                ->setMaxAge(86400)
                ->setSharedMaxAge(86400)
                ->setAutoEtag()
                ->setAutoLastModified();
        }

        return response($disk->get($path), 200, [
            'Content-Type' => $disk->mimeType($path) ?? 'application/octet-stream',
            'Cache-Control' => 'public, max-age=86400, stale-while-revalidate=604800',
        ]);
    }
}
