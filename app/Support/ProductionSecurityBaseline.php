<?php

namespace App\Support;

class ProductionSecurityBaseline
{
    /**
     * @return array<int, array{key: string, message: string}>
     */
    public static function issues(): array
    {
        if (config('app.env') !== 'production') {
            return [];
        }

        $issues = [];

        if (config('app.debug')) {
            $issues[] = [
                'key' => 'app_debug',
                'message' => 'APP_DEBUG is still enabled. Disable debugging in production.',
            ];
        }

        $appUrl = (string) config('app.url');

        if (blank($appUrl) || ! str_starts_with($appUrl, 'https://')) {
            $issues[] = [
                'key' => 'app_url_https',
                'message' => 'APP_URL must use valid HTTPS in production.',
            ];
        }

        if (config('session.secure') !== true) {
            $issues[] = [
                'key' => 'session_secure_cookie',
                'message' => 'SESSION_SECURE_COOKIE must be set to true in production.',
            ];
        }

        return $issues;
    }

    public static function hasIssues(): bool
    {
        return self::issues() !== [];
    }
}