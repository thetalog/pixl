#!/bin/sh
set -eu
SECRET="${TURN_SECRET:-changeme}"
EXTERNAL="${TURN_EXTERNAL_IP:-}"
CONFIG="/tmp/turnserver.conf"
sed "s/TURN_SECRET_PLACEHOLDER/${SECRET}/" /etc/coturn/turnserver.conf.template > "$CONFIG"
if [ -n "$EXTERNAL" ]; then
  JANUS_IP="$(getent hosts janus 2>/dev/null | awk '{print $1}' | head -n1 || true)"
  if [ -n "$JANUS_IP" ]; then
    echo "external-ip=${EXTERNAL}/${JANUS_IP}" >> "$CONFIG"
    echo "allowed-peer-ip=${JANUS_IP}" >> "$CONFIG"
  else
    echo "external-ip=${EXTERNAL}" >> "$CONFIG"
  fi
  echo "allowed-peer-ip=${EXTERNAL}" >> "$CONFIG"
fi
exec turnserver -c "$CONFIG"
