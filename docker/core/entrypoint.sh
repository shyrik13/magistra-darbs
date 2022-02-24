#!/usr/bin/env bash

set -e
echo -e "`/sbin/ip route|awk '/default/ { print $3 }'`\thost.docker.internal" | sudo tee -a /etc/hosts > /dev/null
sudo /usr/bin/supervisord -n -c /etc/supervisor/supervisord.conf
exec "$@"
