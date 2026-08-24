#!/bin/sh
set -eu

DOMAIN="${DOMAIN:-localhost}"
export DOMAIN

envsubst '${DOMAIN}' < /etc/nginx/nginx.conf.template > /etc/nginx/nginx.conf
exec nginx -g 'daemon off;'
