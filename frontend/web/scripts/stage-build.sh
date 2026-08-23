#!/usr/bin/env bash
set -euo pipefail

WEB_DIR="$(cd "$(dirname "$0")/.." && pwd)"
REPO_ROOT="$(cd "$WEB_DIR/../.." && pwd)"
BUILD_DIR="${BUILD_DIR:-$REPO_ROOT/build/frontend}"

echo "Staging frontend build to $BUILD_DIR"

cd "$WEB_DIR"
npm run build

rm -rf "$BUILD_DIR"
mkdir -p "$BUILD_DIR"
cp -R .output/. "$BUILD_DIR/"

test -f "$BUILD_DIR/server/index.mjs"

echo "Frontend build ready at $BUILD_DIR"
