#!/bin/sh
set -e

echo "==> Creating Symfony cache directories..."
mkdir -p var/cache/prod var/cache/dev var/log

echo "==> Warming Symfony production cache..."
php bin/console cache:warmup 2>/dev/null || echo "WARNING: cache warmup had issues, continuing..."

echo "==> Setting cache permissions for runtime writes..."
chmod -R 777 var/

echo "==> Running Doctrine migrations..."
php bin/console doctrine:migrations:migrate --no-interaction --allow-no-migration 2>/dev/null || \
  echo "WARNING: migrations failed (DB unreachable?), continuing startup..."

echo "==> Starting php-fpm and nginx..."
php-fpm -D
exec nginx -g 'daemon off;'
