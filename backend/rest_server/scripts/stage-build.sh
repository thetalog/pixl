#!/usr/bin/env bash
set -euo pipefail

SERVER_DIR="$(cd "$(dirname "$0")/.." && pwd)"
REPO_ROOT="$(cd "$SERVER_DIR/../.." && pwd)"
BUILD_DIR="${BUILD_DIR:-$REPO_ROOT/build/backend}"

echo "Staging backend build to $BUILD_DIR"

mkdir -p "$BUILD_DIR"

rsync -a --delete \
  --exclude node_modules \
  --exclude .env \
  --exclude '.env.*' \
  --exclude .vscode \
  --exclude thumbnail \
  --exclude .DS_Store \
  --exclude .git \
  "$SERVER_DIR/" "$BUILD_DIR/"

cd "$BUILD_DIR"
rm -rf node_modules
npm ci --omit=dev

if [[ -z "${DATABASE_URL:-}" ]]; then
  export DATABASE_URL="mongodb://localhost:27017/pixl-ci"
fi

npx prisma@6.12.0 generate

test -f "$BUILD_DIR/index.js"
test -d "$BUILD_DIR/node_modules/@prisma/client"

echo "Backend build ready at $BUILD_DIR"
