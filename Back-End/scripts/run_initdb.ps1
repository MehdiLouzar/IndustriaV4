# PowerShell script to populate the PostgreSQL database using initDB.sql

$DB_HOST = if ($env:DB_HOST) { $env:DB_HOST } else { 'localhost' }
$DB_PORT = if ($env:DB_PORT) { $env:DB_PORT } else { '5432' }
$DB_USER = if ($env:DB_USER) { $env:DB_USER } else { 'postgres' }
$DB_NAME = if ($env:DB_NAME) { $env:DB_NAME } else { 'industria' }
$SQL_FILE = if ($env:SQL_FILE) { $env:SQL_FILE } else { Join-Path $PSScriptRoot '..\db\init\initDB.sql' }
$DOCKER_SERVICE = if ($env:DOCKER_SERVICE) { $env:DOCKER_SERVICE } else { 'db' }
$PGPASSWORD = if ($env:PGPASSWORD) { $env:PGPASSWORD } else { 'postgres' }

function Run-psql {
  Write-Host "Running $SQL_FILE on ${DB_HOST}:${DB_PORT}/$DB_NAME ..."
  $env:PGPASSWORD = $PGPASSWORD
  & psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f $SQL_FILE
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
  Write-Host "Database initialized."
}

function Run-psqlDocker {
  $compose = if (Get-Command docker-compose -ErrorAction SilentlyContinue) { 'docker-compose' } else { 'docker compose' }
  $container = & $compose ps -q $DOCKER_SERVICE
  if (-not $container) {
    Write-Error "Docker service '$DOCKER_SERVICE' is not running."
    exit 1
  }
  Write-Host "Running $SQL_FILE inside Docker service '$DOCKER_SERVICE' ..."
  & $compose exec -T -e PGPASSWORD=$PGPASSWORD $DOCKER_SERVICE `
    psql -U $DB_USER -d $DB_NAME -f "/docker-entrypoint-initdb.d/$(Split-Path $SQL_FILE -Leaf)"
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
  Write-Host "Database initialized in container."
}

if (Get-Command psql -ErrorAction SilentlyContinue) {
  Run-psql
} elseif (Get-Command docker -ErrorAction SilentlyContinue) {
  Run-psqlDocker
} else {
  Write-Error "Neither psql nor Docker is available."
  exit 1
}
