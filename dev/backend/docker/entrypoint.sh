#!/bin/sh
set -e

echo "==> Running Doctrine migrations..."
php bin/console doctrine:migrations:migrate --no-interaction --allow-no-migration || \
  echo "WARNING: migrations failed (DB unreachable?), continuing startup..."

echo "==> Starting php-fpm and nginx..."
php-fpm -D
exec nginx -g 'daemon off;'
