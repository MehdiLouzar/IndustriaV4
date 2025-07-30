@echo off
setlocal enabledelayedexpansion

echo.
echo ===============================================
echo 🚀 Démarrage de l'environnement Industria
echo ===============================================
echo.

rem Vérification de Docker
docker --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker n'est pas installé ou non accessible
    echo    Veuillez installer Docker Desktop et réessayer
    pause
    exit /b 1
)

docker compose version >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker Compose n'est pas installé ou non accessible
    pause
    exit /b 1
)

echo ✅ Docker et Docker Compose détectés

echo.
echo 🧹 Nettoyage des conteneurs existants...
docker compose down -v --remove-orphans

echo.
echo 🔨 Construction et démarrage des services...
docker compose up --build -d

echo.
echo ⏳ Attente de PostgreSQL...

:wait_postgres
docker compose exec -T db pg_isready -U postgres >nul 2>&1
if errorlevel 1 (
    timeout /t 2 /nobreak >nul
    goto wait_postgres
)
echo ✅ PostgreSQL est prêt !

echo.
echo 👤 Importation des utilisateurs dans Keycloak...
docker compose exec keycloak bash /opt/keycloak/data/import/import-users-and-roles.sh
if errorlevel 1 (
    echo ❌ Échec de l'import des utilisateurs et rôles
    echo 📜 Vérifiez les logs de Keycloak avec : docker compose logs keycloak
) else (
    echo ✅ Importation des utilisateurs réussie !
)

echo.
echo ⏳ Attente du Backend (création des tables en cours...)
set max_backend_attempts=120
set backend_attempt=1

:wait_backend_loop
curl -sf "http://localhost:8080/actuator/health" >nul 2>&1
if not errorlevel 1 (
    echo ✅ Backend est prêt !
    goto backend_ready
)

if %backend_attempt% geq %max_backend_attempts% (
    echo ❌ Timeout: Backend n'est pas disponible
    echo 📜 Logs du Backend :
    docker compose logs backend
    goto show_final_status
)

echo    Tentative %backend_attempt%/%max_backend_attempts% - Hibernate en cours de création des tables...
timeout /t 5 /nobreak >nul
set /a backend_attempt+=1
goto wait_backend_loop

:backend_ready

echo.
echo ⏳ Attente de l'initialisation des données...

:wait_db_init
for /f "tokens=*" %%i in ('docker compose ps db-init --format "{{.Status}}"') do set db_init_status=%%i
echo !db_init_status! | findstr /i "running" >nul
if not errorlevel 1 (
    timeout /t 3 /nobreak >nul
    goto wait_db_init
)

echo !db_init_status! | findstr /i "exited (0)" >nul
if not errorlevel 1 (
    echo ✅ Initialisation des données terminée avec succès !
) else (
    echo ❌ Problème lors de l'initialisation des données
    echo 📜 Logs de l'initialisation :
    docker compose logs db-init
)

echo.
echo 🔍 Vérification finale des services :
for %%s in (db keycloak backend frontend) do (
    for /f "tokens=*" %%i in ('docker compose ps %%s --format "{{.Status}}"') do (
        echo %%i | findstr /i "up" >nul
        if not errorlevel 1 (
            echo    ✅ %%s : En ligne
        ) else (
            echo    ❌ %%s : Problème - %%i
        )
    )
)

echo.
echo ===============================================
echo 🎉 Environnement Industria démarré !
echo ===============================================
echo.
echo 📋 Services disponibles :
echo    • Frontend:  http://localhost:3000
echo    • Backend:   http://localhost:8080
echo    • Keycloak:  http://localhost:8081
echo    • Database:  localhost:5432
echo.
echo 👤 Comptes de test :
echo    • Admin:    admin@zonespro.ma / password123
echo    • Manager:  manager@zonespro.ma / password123
echo    • User:     demo@entreprise.ma / password123
echo.
echo 🔧 Commandes utiles :
echo    • Voir les logs:     docker compose logs -f [service]
echo    • Arrêter:          docker compose down
echo    • Redémarrer:       docker compose restart [service]
echo    • Réinitialiser:    docker compose down -v

endlocal
