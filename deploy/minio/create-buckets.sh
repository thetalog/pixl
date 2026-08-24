#!/usr/bin/env bash
# Create MinIO buckets expected by the Pixl backend (idempotent).
set -euo pipefail

MINIO_ENDPOINT="${MINIO_ENDPOINT:-http://minio:9000}"
MINIO_ROOT_USER="${MINIO_ROOT_USER:?MINIO_ROOT_USER is required}"
MINIO_ROOT_PASSWORD="${MINIO_ROOT_PASSWORD:?MINIO_ROOT_PASSWORD is required}"

POSTS_BUCKET="${MINIO_POSTS_BUCKET:-pixl}"
DM_BUCKET="${MINIO_CONVERSATION_DIRECT_MESSAGE_BUCKET:-conversation-direct-messages}"
GROUP_MSG_BUCKET="${MINIO_CONVERSATION_GROUP_MESSAGE_BUCKET:-conversation-group-messages}"
GROUP_DP_BUCKET="${MINIO_CONVERSATION_GROUP_DP_BUCKET:-conversation-group-dp}"
PROFILE_BUCKET="${MINIO_PROFILE_BUCKET:-pixl-profile}"

echo "Waiting for MinIO at ${MINIO_ENDPOINT}..."
until mc alias set local "${MINIO_ENDPOINT}" "${MINIO_ROOT_USER}" "${MINIO_ROOT_PASSWORD}" >/dev/null 2>&1; do
  sleep 2
done
echo "MinIO is reachable."

for bucket in "$POSTS_BUCKET" "$DM_BUCKET" "$GROUP_MSG_BUCKET" "$GROUP_DP_BUCKET" "$PROFILE_BUCKET"; do
  mc mb --ignore-existing "local/${bucket}"
  # Objects are served through the API /storage proxy; keep buckets private.
  echo "Bucket ready: ${bucket}"
done

echo "MinIO bucket init complete."
