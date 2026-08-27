#!/bin/sh
set -eu
IP="${JANUS_PUBLIC_IP:-127.0.0.1}"
CONFIG_DIR="/usr/local/etc/janus"
if [ ! -d "$CONFIG_DIR" ]; then
  CONFIG_DIR="/etc/janus"
fi
sed "s/NAT_1_1_MAPPING/${IP}/g" "$CONFIG_DIR/janus.jcfg.template" > "$CONFIG_DIR/janus.jcfg"
exec janus -F "$CONFIG_DIR"
