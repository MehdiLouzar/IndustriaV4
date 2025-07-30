@echo off
setlocal enabledelayedexpansion

rem Configuration par défaut
if "%DB_HOST%"=="" set DB_HOST=db
if "%DB_NAME%"=="" set DB_NAME=industria
if "%DB_USER%"=="" set DB_USER=postgres
if "%DB_PASSWORD%"=="" set DB_PASSWORD=postgres

echo 🔍 Waiting for Hibernate to create tables...

rem Tables principales que nous attendons
set REQUIRED_TABLES=users country region zone_type zone parcel activity amenity spatial_reference_system

rem Fonction pour vérifier l'existence d'une table
:check_table_exists
set table_name=%1
for /f %%i in ('docker compose exec -T -e PGPASSWORD^=%DB_PASSWORD% db psql -h %DB_HOST% -U %DB_USER% -d %DB_NAME% -tAc "SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='%table_name%'" 2^>nul') do set table_exists=%%i
if "%table_exists%"=="1" (
    exit /b 0
) else (
    exit /b 1
)

rem Attendre d'abord que PostgreSQL soit accessible
echo 🔌 Checking PostgreSQL connection...
:wait_postgres
docker compose exec -T -e PGPASSWORD=%DB_PASSWORD% db psql -h %DB_HOST% -U %DB_USER% -d %DB_NAME% -c "\q" >nul 2>&1
if errorlevel 1 (
    echo    Waiting for PostgreSQL connection...
    timeout /t 2 /nobreak >nul
    goto wait_postgres
)
echo ✅ PostgreSQL connection established!

rem Attendre que toutes les tables soient créées
set max_attempts=60
set attempt=1

:wait_loop
set all_tables_exist=true
set missing_tables=

for %%t in (%REQUIRED_TABLES%) do (
    call :check_table_exists %%t
    if errorlevel 1 (
        set all_tables_exist=false
        if defined missing_tables (
            set missing_tables=!missing_tables! %%t
        ) else (
            set missing_tables=%%t
        )
    )
)

if "%all_tables_exist%"=="true" (
    echo ✅ All required tables have been created by Hibernate!
    goto success
)

echo    Attempt %attempt%/%max_attempts% - Missing tables: %missing_tables%

if %attempt% geq %max_attempts% (
    echo ❌ Timeout: Not all tables were created within %max_attempts% attempts
    echo    Missing tables: %missing_tables%
    exit /b 1
)

set /a attempt+=1
timeout /t 5 /nobreak >nul
goto wait_loop

:success
echo 🎯 Database schema is ready for data initialization!
endlocal
exit /b 0