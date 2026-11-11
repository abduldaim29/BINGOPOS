<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Product;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class PublicImageTest extends TestCase
{
    public function test_product_and_category_image_urls_are_relative_to_the_current_host(): void
    {
        config(['filesystems.image_disk' => 'public']);

        $product = new Product(['image' => 'product.jpg']);
        $category = new Category(['image' => 'category.jpg']);

        $this->assertSame('/storage/products/product.jpg', $product->image);
        $this->assertSame('/storage/category/category.jpg', $category->image);
    }

    public function test_legacy_localhost_image_urls_are_normalized_even_when_the_port_differs(): void
    {
        config([
            'app.url' => 'http://localhost:8000',
            'filesystems.image_disk' => 'public',
        ]);

        $product = new Product(['image' => 'http://localhost/storage/products/product.jpg']);

        $this->assertSame('/storage/products/product.jpg', $product->image);
    }

    public function test_product_category_and_store_images_are_served_without_a_storage_link(): void
    {
        Storage::fake('public');
        config(['filesystems.image_disk' => 'public']);

        foreach (['products', 'category', 'store'] as $folder) {
            $path = $folder.'/test-image.jpg';
            Storage::disk('public')->put($path, 'test-image');

            $this->get('/storage/'.$path)
                ->assertOk()
                ->assertHeader('Content-Type', 'image/jpeg');
        }
    }

    public function test_pos_product_image_requests_receive_cached_small_webp_thumbnails(): void
    {
        if (! function_exists('imagecreatefromstring') || ! function_exists('imagewebp')) {
            $this->markTestSkipped('GD with WebP support is required to generate POS thumbnails.');
        }

        Storage::fake('public');
        config([
            'filesystems.image_disk' => 'public',
            'filesystems.image_optimizer.enabled' => true,
            'filesystems.image_optimizer.webp_quality' => 82,
        ]);
        $upload = UploadedFile::fake()->image('product.png', 1200, 900);
        Storage::disk('public')->put(
            'products/product.png',
            file_get_contents($upload->getRealPath())
        );

        $response = $this->get('/storage/products/product.png?size=pos')->assertOk();
        $this->assertSame('image/webp', $response->headers->get('Content-Type'));
        $thumbnailPath = collect(Storage::disk('public')->allFiles('products/_thumbnails'))->first();
        $thumbnail = getimagesizefromstring(Storage::disk('public')->get($thumbnailPath));

        $this->assertLessThanOrEqual(320, max($thumbnail[0], $thumbnail[1]));
        $this->assertTrue(Storage::disk('public')->exists('products/product.png'));
        $this->assertSame(
            1,
            count(Storage::disk('public')->allFiles('products/_thumbnails'))
        );

        $this->get('/storage/products/product.png?size=pos')->assertOk();
        $this->assertSame(
            1,
            count(Storage::disk('public')->allFiles('products/_thumbnails'))
        );
    }

    public function test_files_outside_public_image_folders_are_not_served(): void
    {
        Storage::fake('public');
        config(['filesystems.image_disk' => 'public']);
        Storage::disk('public')->put('private/secret.jpg', 'secret');

        $this->get('/storage/private/secret.jpg')->assertNotFound();
        $this->get('/storage/products/../private/secret.jpg')->assertNotFound();
    }
}
