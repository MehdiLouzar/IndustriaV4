#!/usr/bin/env bash
# Populate the PostgreSQL database using the initDB.sql file
set -euo pipefail

# Configuration via environment variables with sensible defaults
DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-5432}
DB_USER=${DB_USER:-postgres}
DB_NAME=${DB_NAME:-industria}
SQL_FILE="${SQL_FILE:-$(dirname "$0")/../db/init/initDB.sql}"

DOCKER_SERVICE=${DOCKER_SERVICE:-db}

run_psql() {
  local pwd="${PGPASSWORD:-postgres}"
  echo "Running ${SQL_FILE} on ${DB_HOST}:${DB_PORT}/${DB_NAME} ..."
  PGPASSWORD="$pwd" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$SQL_FILE"
  echo "Database initialized."
}

run_psql_docker() {
  local compose
  if command -v docker-compose >/dev/null; then
    compose="docker-compose"
  else
    compose="docker compose"
  fi

  if ! $compose ps -q "$DOCKER_SERVICE" >/dev/null; then
    echo "Docker service '$DOCKER_SERVICE' is not running." >&2
    exit 1
  fi

  echo "Running ${SQL_FILE} inside Docker service '$DOCKER_SERVICE' ..."
  $compose exec -T -e PGPASSWORD="${PGPASSWORD:-postgres}" "$DOCKER_SERVICE" \
    psql -U "$DB_USER" -d "$DB_NAME" -f "/docker-entrypoint-initdb.d/$(basename "$SQL_FILE")"
  echo "Database initialized in container."
}

if command -v psql >/dev/null; then
  run_psql
else
  echo "psql not found locally, attempting to use Docker..."
  if command -v docker >/dev/null; then
    run_psql_docker
  else
    echo "Neither psql nor Docker is available." >&2
    exit 1
  fi
fi

