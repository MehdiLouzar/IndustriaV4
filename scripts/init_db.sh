#!/bin/bash
# Populate Industria database with sample data if not already initialized
set -euo pipefail

DB_CONTAINER=${DB_CONTAINER:-db}
DB_NAME=${DB_NAME:-industria}
DB_USER=${DB_USER:-postgres}
DB_PASSWORD=${DB_PASSWORD:-postgres}

PSQL="docker compose exec -e PGPASSWORD=$DB_PASSWORD -T $DB_CONTAINER psql -U $DB_USER -d $DB_NAME"

if ! $PSQL -tAc "SELECT 1 FROM information_schema.tables WHERE table_name='users'" | grep -q 1; then
    echo "Database schema not found. Start the backend once to let Hibernate create the tables."
    exit 1
fi

if $PSQL -tAc "SELECT 1 FROM users LIMIT 1" | grep -q 1; then
    echo "Database already contains users. Skipping initialization."
    exit 0
fi

echo "Loading sample data into $DB_NAME..."
cat backend/db/init/initDB.sql | $PSQL

echo "Database initialization complete."
