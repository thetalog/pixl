#!/bin/sh
set -eu
SECRET="${TURN_SECRET:-changeme}"
EXTERNAL="${TURN_EXTERNAL_IP:-}"
CONFIG="/tmp/turnserver.conf"
sed "s/TURN_SECRET_PLACEHOLDER/${SECRET}/" /etc/coturn/turnserver.conf.template > "$CONFIG"
if [ -n "$EXTERNAL" ]; then
  echo "external-ip=${EXTERNAL}" >> "$CONFIG"
fi
exec turnserver -c "$CONFIG"
