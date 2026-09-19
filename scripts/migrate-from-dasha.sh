#!/bin/bash
# ==============================================================================
# echosh-labs / amra-treasury
# Data Migration Utility: Copy AMRA & YouTube Buckets from Mercury Dasha BoltDB
# ==============================================================================

set -euo pipefail

SOURCE_DB="${1:-/home/justin/code/echosh-labs/mercury-dasha/.data/mercury-dasha-dev.db}"
TARGET_DB="${2:-/home/justin/code/echosh-labs/amra-treasury/.data/amra-treasury-dev.db}"

if [ ! -f "${SOURCE_DB}" ]; then
  echo "Source database not found at ${SOURCE_DB}."
  echo "Usage: ./scripts/migrate-from-dasha.sh [source_db_path] [target_db_path]"
  exit 1
fi

mkdir -p "$(dirname "${TARGET_DB}")"

echo "Copying source database snapshot..."
# If target doesn't exist yet, copying the entire database will preserve all keys
if [ ! -f "${TARGET_DB}" ]; then
  cp "${SOURCE_DB}" "${TARGET_DB}"
  echo "✔ Target database seeded from snapshot at ${TARGET_DB}."
else
  echo "Target database already exists at ${TARGET_DB}. Skipping overwrite to protect existing ledger records."
fi
