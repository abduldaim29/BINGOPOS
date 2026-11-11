<?php

namespace Tests\Feature;

use App\Services\ImageStorageService;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class ImageStorageServiceTest extends TestCase
{
    public function test_uploaded_product_images_are_resized_and_stored_as_webp(): void
    {
        if (! function_exists('imagecreatefromstring')) {
            $this->markTestSkipped('GD is required to optimize images.');
        }

        Storage::fake('public');
        config([
            'filesystems.image_disk' => 'public',
            'filesystems.image_optimizer.enabled' => true,
            'filesystems.image_optimizer.max_dimensions.products' => 1200,
            'filesystems.image_optimizer.webp_quality' => 82,
        ]);

        $path = app(ImageStorageService::class)->store(
            UploadedFile::fake()->image('product.png', 1600, 1200),
            'products'
        );
        $contents = Storage::disk('public')->get($path);
        $image = getimagesizefromstring($contents);

        $this->assertSame('products', dirname($path));
        $this->assertSame('webp', pathinfo($path, PATHINFO_EXTENSION));
        $this->assertSame('image/webp', $image['mime']);
        $this->assertLessThanOrEqual(1200, max($image[0], $image[1]));
    }

    public function test_existing_images_can_be_optimized_without_deleting_the_source(): void
    {
        if (! function_exists('imagecreatefromstring')) {
            $this->markTestSkipped('GD is required to optimize images.');
        }

        Storage::fake('public');
        config([
            'filesystems.image_disk' => 'public',
            'filesystems.image_optimizer.enabled' => true,
            'filesystems.image_optimizer.max_dimensions.products' => 1200,
        ]);

        $upload = UploadedFile::fake()->image('legacy.png', 1600, 1200);
        Storage::disk('public')->put('products/legacy.png', file_get_contents($upload->getRealPath()));
        $service = app(ImageStorageService::class);

        $preview = $service->optimizeStored('legacy.png', 'products');
        $this->assertTrue($preview['changed']);
        $this->assertTrue(Storage::disk('public')->exists('products/legacy.png'));

        $result = $service->optimizeStored('products/legacy.png', 'products', true);
        $this->assertTrue($result['changed']);
        $this->assertSame('webp', pathinfo($result['path'], PATHINFO_EXTENSION));
        $this->assertTrue(Storage::disk('public')->exists('products/legacy.png'));
        $this->assertTrue(Storage::disk('public')->exists($result['path']));
    }
}
