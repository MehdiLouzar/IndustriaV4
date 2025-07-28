#!/bin/bash
# Populate Industria database with sample data if not already initialized
set -euo pipefail

DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-5432}
DB_NAME=${DB_NAME:-industria}
DB_USER=${DB_USER:-postgres}
DB_PASSWORD=${DB_PASSWORD:-postgres}

export PGPASSWORD="$DB_PASSWORD"

PSQL="psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME"

if $PSQL -tAc "SELECT 1 FROM information_schema.tables WHERE table_name='users'" | grep -q 1; then
    if $PSQL -tAc "SELECT 1 FROM users LIMIT 1" | grep -q 1; then
        echo "Database already contains users. Skipping initialization."
        exit 0
    fi
fi

echo "Loading sample data into $DB_NAME..."
$PSQL -f backend/db/init/initDB.sql

echo "Database initialization complete."
