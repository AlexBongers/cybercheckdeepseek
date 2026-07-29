#!/bin/sh
set -eu

APP_DIR="/share/Web/cybercheck"
export NODE_ENV=production
export HOSTNAME=127.0.0.1
export PORT=3000
export SQLITE_DB_PATH="$APP_DIR/data/cybercheck.db"

cd "$APP_DIR"
mkdir -p "$APP_DIR/data"

exec npm run start:standalone
