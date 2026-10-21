# syntax=docker/dockerfile:1

FROM php:8.4-cli

ENV DEBIAN_FRONTEND=noninteractive \
    PORT=10000 \
    APP_ENV=production \
    APP_DEBUG=false

# Install system dependencies and PHP extensions needed by Laravel + Vite build.
RUN apt-get update && apt-get install -y --no-install-recommends \
    git \
    unzip \
    libzip-dev \
    libpng-dev \
    libjpeg-dev \
    libfreetype6-dev \
    libicu-dev \
    libxml2-dev \
    libonig-dev \
    libsqlite3-dev \
    libcurl4-openssl-dev \
    libssl-dev \
    ca-certificates \
    curl \
    && docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install pdo_mysql pdo_sqlite mbstring zip gd exif intl bcmath pcntl \
    && curl -fsSL https://deb.nodesource.com/setup_24.x | bash - \
    && apt-get install -y nodejs \
    && npm install -g npm@latest \
    && rm -rf /var/lib/apt/lists/*

# Install Composer.
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

COPY . /var/www/html

# Install PHP and Node dependencies and build the frontend.
RUN composer install --no-interaction --no-progress --prefer-dist --no-dev --optimize-autoloader \
    && npm ci --no-audit --no-fund \
    && npm run build

# Laravel runtime preparation.
RUN php artisan storage:link || true \
    && chmod -R 775 storage bootstrap/cache public \
    && chown -R www-data:www-data storage bootstrap/cache public || true

EXPOSE 10000

CMD ["sh", "-c", "php artisan migrate --force || true; php artisan config:clear || true; php artisan route:clear || true; php artisan view:clear || true; php artisan optimize:clear || true; php artisan serve --host 0.0.0.0 --port ${PORT}"]
