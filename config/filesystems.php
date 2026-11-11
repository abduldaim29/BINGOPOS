
<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Default Filesystem Disk
    |--------------------------------------------------------------------------
    */

    'default' => env('FILESYSTEM_DISK', 'local'),

    // Disk used specifically for product, category, and store images.
    'image_disk' => env('IMAGE_DISK', 'public'),

    // Public URL prefix used to generate image URLs.
    'image_url' => env(
        'IMAGE_PUBLIC_URL',
        env('VITE_PUBLIC_STORAGE_URL', '')
    ),

    'image_optimizer' => [
        'enabled' => env('IMAGE_OPTIMIZER_ENABLED', true),
        'webp_quality' => (int) env('IMAGE_WEBP_QUALITY', 82),
        'jpeg_quality' => (int) env('IMAGE_JPEG_QUALITY', 82),
        'max_pixels' => (int) env('IMAGE_MAX_PIXELS', 16000000),
        'max_dimensions' => [
            'products' => (int) env('PRODUCT_IMAGE_MAX_DIMENSION', 1200),
            'category' => (int) env('CATEGORY_IMAGE_MAX_DIMENSION', 800),
            'store' => (int) env('STORE_IMAGE_MAX_DIMENSION', 800),
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Filesystem Disks
    |--------------------------------------------------------------------------
    */

    'disks' => [

        'local' => [
            'driver' => 'local',
            'root' => storage_path('app'),
            'throw' => false,
        ],

        'public' => [
            'driver' => 'local',
            'root' => storage_path('app/public'),
            'url' => rtrim(env('APP_URL', ''), '/').'/storage',
            'visibility' => 'public',
            'throw' => false,
        ],

        's3' => [
            'driver' => 's3',
            'key' => env('AWS_ACCESS_KEY_ID'),
            'secret' => env('AWS_SECRET_ACCESS_KEY'),
            'region' => env('AWS_DEFAULT_REGION', 'ap-south-1'),
            'bucket' => env('AWS_BUCKET'),
            'visibility' => env('AWS_DEFAULT_VISIBILITY', 'public'),
            'url' => env(
                'AWS_URL',
                env(
                    'IMAGE_PUBLIC_URL',
                    env('VITE_PUBLIC_STORAGE_URL', '')
                )
            ),
            'endpoint' => env('AWS_ENDPOINT'),
            'use_path_style_endpoint' => env(
                'AWS_USE_PATH_STYLE_ENDPOINT',
                true
            ),
            'throw' => true,
        ],

    ],

    /*
    |--------------------------------------------------------------------------
    | Symbolic Links
    |--------------------------------------------------------------------------
    */

    'links' => [
        public_path('storage') => storage_path('app/public'),
    ],

];
