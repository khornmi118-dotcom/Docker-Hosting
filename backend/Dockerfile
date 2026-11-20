FROM php:8.4-cli

RUN apt-get update && apt-get install -y \
    git unzip libzip-dev libpng-dev libonig-dev libxml2-dev \
    && docker-php-ext-install pdo_mysql mbstring zip exif pcntl bcmath

COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html
COPY . .

RUN composer install --no-interaction --prefer-dist --optimize-autoloader

EXPOSE 3000
CMD ["php", "artisan", "serve", "--host=0.0.0.0", "--port=3000"]
