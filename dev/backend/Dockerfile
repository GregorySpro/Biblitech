FROM php:8.3-fpm-alpine

# Extensions système nécessaires
RUN apk add --no-cache \
    nginx \
    postgresql-dev \
    icu-dev \
    libzip-dev \
    oniguruma-dev \
    openssl \
    && docker-php-ext-install \
        pdo_pgsql \
        intl \
        zip \
        opcache

# Installer Composer
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

# Copier les dépendances et installer
COPY composer.json composer.lock* ./
RUN composer install --no-dev --optimize-autoloader --no-interaction --prefer-dist

# Copier l'application
COPY . .

# Générer les clés JWT (si non existantes)
RUN mkdir -p config/jwt && \
    if [ ! -f config/jwt/private.pem ]; then \
        openssl genpkey -algorithm RSA -out config/jwt/private.pem -aes256 -pass pass:${JWT_PASSPHRASE:-secret} && \
        openssl rsa -pubout -in config/jwt/private.pem -out config/jwt/public.pem -passin pass:${JWT_PASSPHRASE:-secret}; \
    fi

# Permissions
RUN chown -R www-data:www-data var/ && \
    chmod -R 775 var/

# Config nginx
COPY docker/nginx.conf /etc/nginx/nginx.conf

EXPOSE 8080

CMD ["sh", "-c", "php-fpm -D && nginx -g 'daemon off;'"]
