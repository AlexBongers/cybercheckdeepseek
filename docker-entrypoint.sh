#!/bin/sh
set -eu

DB_PATH="${SQLITE_DB_PATH:-/data/cybercheck.db}"
SEED_DEMO="${SEED_DEMO:-true}"

mkdir -p "$(dirname "$DB_PATH")"

if [ "$SEED_DEMO" = "true" ] && [ ! -f "$DB_PATH" ]; then
  echo "No SQLite database found at $DB_PATH; creating demo database."
  SQLITE_DB_PATH="$DB_PATH" node scripts/seed-demo.mjs
fi

exec "$@"
