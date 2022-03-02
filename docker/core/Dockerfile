ARG PHP_VERSION

FROM php:${PHP_VERSION}-fpm

ARG PHP_TIMEZONE=Europe/Riga
ARG PHP_MEMORY_LIMIT
ARG USER_ID
ARG GROUP_ID
ARG ENV

RUN apt-get -yqq update && \
    apt-get install --no-install-recommends --no-install-suggests -y gnupg1 \
    openssl \
    git \
    unzip \
    libzip-dev \
    nano \
    sl \
    libpng-dev \
    libmagickwand-dev \
    curl \
    libssl-dev \
    libgmp-dev re2c libmhash-dev libmcrypt-dev file \
    procps

RUN ln -s /usr/include/x86_64-linux-gnu/gmp.h /usr/local/include/

# Install PHP extensions. Type docker-php-ext-install to see available extensions
RUN docker-php-ext-configure gmp
RUN docker-php-ext-configure zip --with-libzip && \
    docker-php-ext-install -j$(nproc) \
    pdo \
    pdo_mysql \
    opcache \
    zip \
    bcmath \
    gmp

RUN apt-get install -y libicu-dev \
    && docker-php-ext-configure intl \
    && docker-php-ext-install intl

RUN pecl install \
    mongodb \
    imagick \
    http

RUN docker-php-ext-enable \
    mongodb \
    imagick

# Set timezone
RUN ln -snf /usr/share/zoneinfo/${PHP_TIMEZONE} /etc/localtime && echo ${PHP_TIMEZONE} > /etc/timezone \
&& printf '[PHP]\ndate.timezone = "%s"\n' ${PHP_TIMEZONE} > $PHP_INI_DIR/conf.d/tzone.ini \
&& "date"
RUN echo "memory_limit = -1" >> /usr/local/etc/php/conf.d/docker-php-memlimit.ini;

# Install composer
RUN php -r "copy('https://getcomposer.org/installer', 'composer-setup.php');"
RUN php composer-setup.php
RUN php -r "unlink('composer-setup.php');"
RUN mv composer.phar /usr/local/bin/composer
RUN mkdir -p /var/www/.composer
COPY composer/config.json /var/www/.composer/config.json
RUN chown -R ${USER_ID}:${GROUP_ID} /var/www/.composer && \
    chown ${USER_ID}:${GROUP_ID} /var/www

# --stable - update to latest version, i.e. for now v2+. It can cause problems with dependencies.
# RUN composer self-update --stable
RUN composer self-update 1.10.17

# npm & node
# !!! if you has problems with it try - docker system prune -a
# !!!!!! carefully read - https://docs.docker.com/engine/reference/commandline/system_prune/
RUN curl -sL https://deb.nodesource.com/setup_14.x | bash && \
    apt-get install -y nodejs

# bugfix: remove cmdtest to install yarn correctly.
RUN apt-get remove -y cmdtest

# yarn package manager
RUN curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg | apt-key add - && \
    echo "deb https://dl.yarnpkg.com/debian/ stable main" | tee /etc/apt/sources.list.d/yarn.list && \
    apt-get update && \
    apt-get install -y yarn

RUN apt-get remove --purge -y gnupg1 && apt-get -y --purge autoremove && rm -rf /var/lib/apt/lists/*

# Map user id from host user when it's provided
RUN if [ ! -z ${USER_ID} ]; then usermod -u ${USER_ID} www-data; fi
RUN if [ ! -z ${GROUP_ID} ]; then groupmod -g ${GROUP_ID} www-data; fi

RUN echo 'alias sf="php bin/console"' >> /var/www/.bashrc

RUN apt-get update && \
    apt-get install --no-install-recommends --no-install-suggests -y cron htop supervisor gosu sudo iproute2

COPY programs.conf /etc/supervisor/conf.d/programs.conf

COPY supervisord.conf /etc/supervisor/supervisord.conf
COPY crontab /etc/cron.d/first
RUN mkdir -p /tmp/supervisor
RUN chown ${USER_ID}:${GROUP_ID} /tmp/supervisor
WORKDIR /var/www/project

COPY entrypoint.sh /entrypoint.sh
ADD rootCA.${ENV}.pem /usr/local/share/ca-certificates/rootCA.crt
ADD cacert.pem /usr/local/share/ca-certificates/cacert.crt
RUN update-ca-certificates

RUN chmod +x /entrypoint.sh
RUN usermod -aG sudo www-data && \
    echo 'www-data ALL=(ALL) NOPASSWD:ALL' >> /etc/sudoers

# Related to - https://stackoverflow.com/questions/37060171/php-ini-file-nowhere-to-be-found
COPY php.ini /usr/local/etc/php

USER ${USER_ID}
ENTRYPOINT ["/entrypoint.sh"]
