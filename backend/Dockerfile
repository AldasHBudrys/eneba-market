# Render builds and runs this image. Dependencies are installed before copying the app so Docker can cache that layer.
FROM php:8.5-cli

RUN apt-get update && apt-get install -y --no-install-recommends libpq-dev unzip git \
    && docker-php-ext-install pdo_pgsql \
    && rm -rf /var/lib/apt/lists/*
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /app
COPY composer.json composer.lock ./
RUN composer install --no-dev --no-scripts --no-autoloader --no-interaction

COPY . .
RUN composer dump-autoload --optimize && php artisan package:discover

# shortcut: `artisan serve` (PHP's built-in server, 4 workers) instead of nginx + php-fpm; fine for a demo, swap for a real web server under real traffic.
ENV PHP_CLI_SERVER_WORKERS=4
# db:seed only fills an empty database (see DatabaseSeeder), so it's safe on every start.
CMD php artisan config:cache && php artisan migrate --force && php artisan db:seed --force && php artisan serve --host=0.0.0.0 --port=${PORT:-8000}
