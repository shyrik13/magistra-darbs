#!/bin/bash

if [ ! -f .env.local ]; then
    cp .env .env.local

    TMP_USER_ID=`id -u`
    TMP_GROUP_ID=`id -g`
    sed -i 's#USER_ID=#'"USER_ID=${TMP_USER_ID}"'#g' .env.local
    sed -i 's#GROUP_ID=#'"GROUP_ID=${TMP_GROUP_ID}"'#g' .env.local
fi

source ./.env.local

mkdir -p ${PROJECT_PATH_CORE}
mkdir -p ${PROJECT_PATH}/${SYMFONY_LOG_PATH}
mkdir -p ${SYMFONY_LOG_PATH}
mkdir -p ${COMPOSER_PATH}
mkdir -p ${COMPOSER_PATH}/cache
mkdir -p ${SSH_KEY_PATH}
mkdir -p ${NGINX_LOG_PATH}
mkdir -p ${CRON_LOG_PATH}

docker-compose build
docker-compose up -d
