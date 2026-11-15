import type { DockerStrategy } from '../dockerfile-strategy.types.js';

import { hasFile } from '../dockerfile-strategy.shared.js';

export const symfonyStrategy: DockerStrategy = {
  id: 'PHP',

  verify() {
    if (!this.id || !this.generate || !this.matches) {
      throw new Error('Invalid PHP strategy');
    }
  },

  matches(context) {
    return (
      context.componentType.toUpperCase() === 'BACKEND' &&
      hasFile(context.files, context.root, 'composer.json') &&
      hasFile(context.files, context.root, 'public/index.php')
    );
  },

  generate() {
    const content = [
      'FROM composer:2 AS vendor',
      'WORKDIR /app',
      'COPY composer.json composer.lock* symfony.lock* ./',
      'RUN composer install --no-dev --no-scripts --no-autoloader --prefer-dist',
      'COPY . .',
      'RUN composer dump-autoload --optimize --no-dev --classmap-authoritative',
      '',
      'FROM php:8.3-apache',
      'RUN apt-get update && apt-get install -y --no-install-recommends ' +
        'libicu-dev libzip-dev unzip \\',
      ' && docker-php-ext-install intl zip opcache pdo_mysql \\',
      ' && a2enmod rewrite && rm -rf /var/lib/apt/lists/*',
      'ENV APP_ENV=prod APACHE_DOCUMENT_ROOT=/var/www/html/public',
      "RUN sed -ri -e 's!/var/www/html!${APACHE_DOCUMENT_ROOT}!g' \\",
      '    /etc/apache2/sites-available/*.conf /etc/apache2/apache2.conf ' +
        '/etc/apache2/conf-available/*.conf',
      'WORKDIR /var/www/html',
      'COPY --from=vendor /app /var/www/html',
      'RUN mkdir -p var && chown -R www-data:www-data var',
      'EXPOSE 80',
      '',
    ].join('\n');

    return {
      content,
      files: [],
      warnings: [
        'Selected from the file layout (composer.json + public/index.php); written for Symfony.',
        'Other frameworks with a public/ folder, such as Laravel, would also match.',
        'Uses pdo_mysql; switch to pdo_pgsql (and libpq-dev) for PostgreSQL.',
        'Provide DATABASE_URL and APP_SECRET through a Kubernetes Secret.',
        'Docker build has not been executed.',
      ],
    };
  },
};