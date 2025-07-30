@echo off
setlocal enabledelayedexpansion

rem Default values
if "%DB_CONTAINER%"=="" set DB_CONTAINER=db
if "%DB_NAME%"=="" set DB_NAME=industria
if "%DB_USER%"=="" set DB_USER=postgres
if "%DB_PASSWORD%"=="" set DB_PASSWORD=postgres

rem Build psql command to run inside the database container
rem Use -e to pass PGPASSWORD in an OS agnostic way
set "PSQL=docker compose exec -e PGPASSWORD=%DB_PASSWORD% -T %DB_CONTAINER% psql -U %DB_USER% -d %DB_NAME%"

rem verify container is running
for /f %%C in ('docker compose ps -q %DB_CONTAINER%') do set CONTAINER_ID=%%C
if "!CONTAINER_ID!"=="" (
    echo Service "%DB_CONTAINER%" is not running. Start it with "docker compose up -d %DB_CONTAINER%".
    goto :EOF
)

for /f %%A in ('%PSQL% -tAc "SELECT 1 FROM information_schema.tables WHERE table_name=''users''"') do set HAS_TABLE=%%A

if NOT "!HAS_TABLE!"=="1" (
    echo Database schema not found. Start the backend once to let Hibernate create the tables.
    goto :EOF
)

for /f %%B in ('%PSQL% -tAc "SELECT 1 FROM users LIMIT 1"') do set HAS_USER=%%B
if "!HAS_USER!"=="1" (
    echo Database already contains users. Skipping initialization.
    goto :EOF
)

echo Loading sample data into %DB_NAME%...
type backend\db\init\initDB.sql | %PSQL%

echo Database initialization complete.
endlocal

