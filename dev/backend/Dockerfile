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
RUN composer install --no-dev --optimize-autoloader --no-interaction --prefer-dist --no-scripts

# Copier l'application
COPY . .

# Générer les clés JWT sans passphrase (protégées par l'accès conteneur)
# JWT_PASSPHRASE doit être "" (vide) dans les variables d'environnement de production
RUN mkdir -p config/jwt && \
    openssl genpkey -algorithm RSA -pkeyopt rsa_keygen_bits:4096 \
        -out config/jwt/private.pem && \
    openssl pkey -in config/jwt/private.pem -pubout \
        -out config/jwt/public.pem

# Créer les répertoires Symfony nécessaires
RUN mkdir -p var/cache var/log

# Permissions
RUN chown -R www-data:www-data var/ config/jwt/ && \
    chmod -R 775 var/ && \
    chmod 600 config/jwt/private.pem && \
    chmod 644 config/jwt/public.pem

# Config nginx
COPY docker/nginx.conf /etc/nginx/nginx.conf

# Entrypoint (migrations + server)
COPY docker/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 8080

CMD ["/entrypoint.sh"]
