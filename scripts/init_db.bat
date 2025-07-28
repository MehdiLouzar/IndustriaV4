@echo off
setlocal enabledelayedexpansion

rem Default values
if "%DB_HOST%"=="" set DB_HOST=localhost
if "%DB_PORT%"=="" set DB_PORT=5432
if "%DB_NAME%"=="" set DB_NAME=industria
if "%DB_USER%"=="" set DB_USER=postgres
if "%DB_PASSWORD%"=="" set DB_PASSWORD=postgres

set PGPASSWORD=%DB_PASSWORD%
set PSQL=psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME%

for /f %%A in ('%PSQL% -tAc "SELECT 1 FROM information_schema.tables WHERE table_name=''users''"') do set HAS_TABLE=%%A
if "!HAS_TABLE!"=="1" (
    for /f %%B in ('%PSQL% -tAc "SELECT 1 FROM users LIMIT 1"') do set HAS_USER=%%B
    if "!HAS_USER!"=="1" (
        echo Database already contains users. Skipping initialization.
        goto :EOF
    )
)

echo Loading sample data into %DB_NAME%...
%PSQL% -f backend/db/init/initDB.sql

echo Database initialization complete.
endlocal
