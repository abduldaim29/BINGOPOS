<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class ImageStorageService
{
    private const FOLDERS = ['products', 'category', 'store'];

    public function store(UploadedFile $upload, string $folder): string
    {
        $this->assertFolder($folder);
        $contents = file_get_contents($upload->getRealPath());

        if ($contents === false) {
            throw new \RuntimeException('The uploaded image could not be read.');
        }

        $optimized = $this->optimizeContents($contents, $folder, true);

        return $this->write($folder, $this->extensionForMime($optimized['mime']), $optimized['contents']);
    }

    public function optimizeStored(string $path, string $folder, bool $write = false): array
    {
        $this->assertFolder($folder);
        $path = $this->normalizePath($path, $folder);
        $disk = Storage::disk(config('filesystems.image_disk', 'public'));

        if (! $disk->exists($path)) {
            return ['path' => $path, 'changed' => false, 'saved_bytes' => 0];
        }

        if (strtolower(pathinfo($path, PATHINFO_EXTENSION)) === 'webp') {
            return ['path' => $path, 'changed' => false, 'saved_bytes' => 0];
        }

        $contents = $disk->get($path);
        if (! is_string($contents) || $contents === '') {
            return ['path' => $path, 'changed' => false, 'saved_bytes' => 0];
        }

        $optimized = $this->optimizeContents($contents, $folder, false);
        $savedBytes = strlen($contents) - strlen($optimized['contents']);

        if (! $optimized['changed'] || $savedBytes <= 0) {
            return ['path' => $path, 'changed' => false, 'saved_bytes' => 0];
        }

        if (! $write) {
            return ['path' => $path, 'changed' => true, 'saved_bytes' => $savedBytes];
        }

        return [
            'path' => $this->write($folder, $this->extensionForMime($optimized['mime']), $optimized['contents']),
            'changed' => true,
            'saved_bytes' => $savedBytes,
        ];
    }

    public function productThumbnailPath(string $path): string
    {
        $path = $this->normalizePath($path, 'products');
        $disk = Storage::disk(config('filesystems.image_disk', 'public'));
        if (! $disk->exists($path)) {
            return $path;
        }

        if (! config('filesystems.image_optimizer.enabled', true)
            || ! function_exists('imagecreatefromstring')) {
            return $path;
        }

        $sourceMime = $disk->mimeType($path);
        $extension = function_exists('imagewebp')
            ? 'webp'
            : ($sourceMime === 'image/png' ? 'png' : 'jpg');
        $thumbnailPath = 'products/_thumbnails/'.hash('sha256', $path).'.'.$extension;
        if ($disk->exists($thumbnailPath)) {
            return $thumbnailPath;
        }

        $contents = $disk->get($path);
        if (! is_string($contents) || $contents === '') {
            return $path;
        }

        $optimized = $this->optimizeContents($contents, 'products', false, 320);
        if (! $optimized['changed']) {
            return $path;
        }

        $thumbnailPath = 'products/_thumbnails/'.hash('sha256', $path).'.'.$this->extensionForMime($optimized['mime']);
        if (! $disk->put($thumbnailPath, $optimized['contents'], ['visibility' => 'public'])) {
            throw new \RuntimeException("Unable to store product thumbnail [{$thumbnailPath}].");
        }

        return $thumbnailPath;
    }

    public function url(?string $value, string $folder): ?string
    {
        if (! is_string($value) || trim($value) === '') {
            return null;
        }

        $value = trim($value);
        if (preg_match('~^(?:blob:|data:)~i', $value)) {
            return $value;
        }

        if (preg_match('~^https?://~i', $value)) {
            try {
                $configuredPath = $this->pathFromConfiguredUrl($value, $folder);
            } catch (\InvalidArgumentException) {
                return $value;
            }

            $configuredPath = ltrim($configuredPath, '/');
            if (! str_starts_with($configuredPath, $folder.'/')
                && ! preg_match('~^(?:public/)?storage/'.$folder.'/~i', $configuredPath)) {
                return $value;
            }

            $value = $configuredPath;
        }

        $path = $this->normalizePath($value, $folder);
        $baseUrl = rtrim((string) config('filesystems.image_url'), '/');

        if (config('filesystems.image_disk', 'public') === 's3') {
            $baseUrl = $baseUrl ?: rtrim((string) config('filesystems.disks.s3.url'), '/');

            return $baseUrl !== ''
                ? $baseUrl.'/'.$path
                : Storage::disk('s3')->url($path);
        }

        return '/storage/'.$path;
    }

    public function normalizePath(string $value, string $folder): string
    {
        $this->assertFolder($folder);
        $value = str_replace('\\', '/', trim($value));

        if (preg_match('~^https?://~i', $value)) {
            $value = $this->pathFromConfiguredUrl($value, $folder);
        }

        $value = ltrim($value, '/');
        $value = preg_replace('~^(?:public/)?storage/~i', '', $value) ?? $value;

        if (! str_starts_with($value, $folder.'/')) {
            $value = $folder.'/'.$value;
        }

        $segments = explode('/', $value);
        if (in_array('', $segments, true) || in_array('.', $segments, true) || in_array('..', $segments, true)) {
            throw new \InvalidArgumentException('Invalid image storage path.');
        }

        return $value;
    }

    public function delete(string $value, string $folder): void
    {
        if (preg_match('~^https?://~i', $value)) {
            try {
                $this->pathFromConfiguredUrl($value, $folder);
            } catch (\InvalidArgumentException) {
                return;
            }
        }

        $path = $this->normalizePath($value, $folder);
        $disk = Storage::disk(config('filesystems.image_disk', 'public'));

        if ($disk->exists($path) && ! $disk->delete($path)) {
            throw new \RuntimeException("Unable to remove the old image [{$path}].");
        }
    }

    private function pathFromConfiguredUrl(string $value, string $folder): string
    {
        $url = parse_url($value);
        if (! is_array($url) || empty($url['host'])) {
            throw new \InvalidArgumentException('Invalid image URL.');
        }

        $baseUrls = [
            config('filesystems.image_url'),
            config('filesystems.disks.public.url'),
            config('filesystems.disks.s3.url'),
            config('app.url'),
        ];

        foreach (array_filter($baseUrls) as $baseUrl) {
            $base = parse_url($baseUrl);
            if (! is_array($base) || empty($base['host'])) {
                continue;
            }

            $baseHost = strtolower($base['host'] ?? '');
            $imageHost = strtolower($url['host']);
            $bothLocal = in_array($baseHost, ['localhost', '127.0.0.1', '[::1]'], true)
                && in_array($imageHost, ['localhost', '127.0.0.1', '[::1]'], true);
            if ((! $bothLocal && $baseHost !== $imageHost)
                || (! $bothLocal && ($base['port'] ?? null) !== ($url['port'] ?? null))) {
                continue;
            }

            $basePath = trim($base['path'] ?? '', '/');
            $path = ltrim($url['path'] ?? '', '/');

            if ($basePath !== '' && str_starts_with($path, $basePath.'/')) {
                $path = substr($path, strlen($basePath) + 1);
            }

            return $path;
        }

        throw new \InvalidArgumentException('The image URL does not belong to a configured storage host.');
    }

    private function optimizeContents(
        string $contents,
        string $folder,
        bool $strict,
        ?int $maxDimensionOverride = null
    ): array
    {
        $imageInfo = @getimagesizefromstring($contents);
        if ($imageInfo === false || ! in_array($imageInfo['mime'] ?? '', ['image/jpeg', 'image/png', 'image/webp'], true)) {
            if ($strict) {
                throw ValidationException::withMessages([
                    'image' => 'Upload a valid JPEG, PNG, or WebP image.',
                ]);
            }

            return ['contents' => $contents, 'mime' => $imageInfo['mime'] ?? 'application/octet-stream', 'changed' => false];
        }

        $width = (int) $imageInfo[0];
        $height = (int) $imageInfo[1];
        $maxPixels = max(1, (int) config('filesystems.image_optimizer.max_pixels', 16000000));

        if ($width < 1 || $height < 1 || $width * $height > $maxPixels) {
            if ($strict) {
                throw ValidationException::withMessages([
                    'image' => 'The image dimensions are too large. Resize it and upload it again.',
                ]);
            }

            return ['contents' => $contents, 'mime' => $imageInfo['mime'], 'changed' => false];
        }

        if (! config('filesystems.image_optimizer.enabled', true)
            || ! function_exists('imagecreatefromstring')) {
            if (config('filesystems.image_optimizer.enabled', true)) {
                Log::warning('Image optimization skipped because the GD extension is unavailable.', [
                    'folder' => $folder,
                ]);
            }

            return ['contents' => $contents, 'mime' => $imageInfo['mime'], 'changed' => false];
        }

        $source = @imagecreatefromstring($contents);
        if ($source === false) {
            if ($strict) {
                throw ValidationException::withMessages([
                    'image' => 'The uploaded image could not be decoded.',
                ]);
            }

            return ['contents' => $contents, 'mime' => $imageInfo['mime'], 'changed' => false];
        }

        $maxDimension = max(
            1,
            $maxDimensionOverride ?? (int) config("filesystems.image_optimizer.max_dimensions.{$folder}", 1200)
        );
        $scale = min(1, $maxDimension / max($width, $height));
        $targetWidth = max(1, (int) round($width * $scale));
        $targetHeight = max(1, (int) round($height * $scale));
        $canvas = imagecreatetruecolor($targetWidth, $targetHeight);

        if ($imageInfo['mime'] === 'image/jpeg') {
            $background = imagecolorallocate($canvas, 255, 255, 255);
            imagefill($canvas, 0, 0, $background);
        } else {
            imagealphablending($canvas, false);
            imagesavealpha($canvas, true);
            imagefill($canvas, 0, 0, imagecolorallocatealpha($canvas, 0, 0, 0, 127));
        }

        imagecopyresampled($canvas, $source, 0, 0, 0, 0, $targetWidth, $targetHeight, $width, $height);

        ob_start();
        if (function_exists('imagewebp')) {
            $encoded = imagewebp(
                $canvas,
                null,
                max(0, min(100, (int) config('filesystems.image_optimizer.webp_quality', 82)))
            );
            $outputMime = 'image/webp';
        } elseif ($imageInfo['mime'] === 'image/png') {
            $encoded = imagepng($canvas, null, 9);
            $outputMime = 'image/png';
        } else {
            $encoded = imagejpeg(
                $canvas,
                null,
                max(0, min(100, (int) config('filesystems.image_optimizer.jpeg_quality', 82)))
            );
            $outputMime = 'image/jpeg';
        }

        $optimizedContents = ob_get_clean();
        imagedestroy($source);
        imagedestroy($canvas);

        if (! $encoded || ! is_string($optimizedContents) || $optimizedContents === '') {
            if ($strict) {
                throw new \RuntimeException('The image optimizer failed to encode the uploaded image.');
            }

            return ['contents' => $contents, 'mime' => $imageInfo['mime'], 'changed' => false];
        }

        if (strlen($optimizedContents) >= strlen($contents)) {
            return ['contents' => $contents, 'mime' => $imageInfo['mime'], 'changed' => false];
        }

        return ['contents' => $optimizedContents, 'mime' => $outputMime, 'changed' => true];
    }

    private function write(string $folder, string $extension, string $contents): string
    {
        $path = $folder.'/'.Str::random(40).'.'.$extension;
        $disk = Storage::disk(config('filesystems.image_disk', 'public'));

        if (! $disk->put($path, $contents, ['visibility' => 'public'])) {
            throw new \RuntimeException("Unable to store image [{$path}].");
        }

        return $path;
    }

    private function extensionForMime(string $mime): string
    {
        return match ($mime) {
            'image/jpeg' => 'jpg',
            'image/png' => 'png',
            'image/webp' => 'webp',
            default => throw new \InvalidArgumentException('Unsupported image type.'),
        };
    }

    private function assertFolder(string $folder): void
    {
        if (! in_array($folder, self::FOLDERS, true)) {
            throw new \InvalidArgumentException('Unsupported image storage folder.');
        }
    }
}
