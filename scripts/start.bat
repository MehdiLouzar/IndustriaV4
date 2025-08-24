@echo off
rem start.bat — Démarrage de l'environnement Industria (Windows)

setlocal enabledelayedexpansion
echo.
echo ===============================================
echo 🚀 Démarrage de l'environnement Industria
echo ===============================================
echo.

rem Vérification de Docker et Docker Compose
docker --version >nul 2>&1 || (
  echo ❌ Docker n'est pas installé ou non accessible
  exit /b 1
)
docker compose version >nul 2>&1 || (
  echo ❌ Docker Compose n'est pas installé ou non accessible
  exit /b 1
)
echo ✅ Docker et Docker Compose détectés
echo.

rem Nettoyage des conteneurs existants
echo 🧹 Nettoyage des conteneurs existants...
docker compose down -v --remove-orphans
echo.

rem Construction et démarrage des services
echo 🔨 Construction et démarrage des services...
docker compose up --build -d
echo.

rem Attente de PostgreSQL
echo ⏳ Attente de PostgreSQL...
:wait_postgres
docker compose exec -T db pg_isready -U postgres >nul 2>&1
if errorlevel 1 (
    timeout /t 2 /nobreak >nul
    goto wait_postgres
)
echo ✅ PostgreSQL est prêt !
echo.

rem Attente Keycloak
echo ⏳ Attente de Keycloak...
set max_kc=60
set cnt=0
:wait_keycloak
curl -sf "http://keycloak:8081/realms/industria" >nul 2>&1
if not errorlevel 1 (
  docker compose exec keycloak bash /opt/keycloak/data/import/import-users-and-roles.sh 
  echo ✅ Keycloak est prêt !
) else (
  set /a cnt+=1
  if !cnt! geq !max_kc! (
    echo ❌ Timeout: Keycloak n'est pas disponible
    exit /b 1
  )
  echo   Tentative !cnt!/!max_kc!...
  timeout /t 5 /nobreak >nul
  goto wait_keycloak
)
echo.

rem Attente Backend
echo ⏳ Attente du Backend...
set max_be=60
set cnt=0
:wait_backend
curl -sf "http://localhost:8080/actuator/health" >nul 2>&1
if not errorlevel 1 (
  echo ✅ Backend est prêt !
) else (
  set /a cnt+=1
  if !cnt! geq !max_be! (
    echo ❌ Timeout: Backend n'est pas disponible
    exit /b 1
  )
  echo   Tentative !cnt!/!max_be!...
  timeout /t 5 /nobreak >nul
  goto wait_backend
)
echo.

rem Attente Frontend
echo ⏳ Attente du Frontend...
set max_fe=60
set cnt=0
:wait_frontend
curl -sf "http://localhost:3000" >nul 2>&1
if not errorlevel 1 (
  echo ✅ Frontend est prêt !
) else (
  set /a cnt+=1
  if !cnt! geq !max_fe! (
    echo ❌ Timeout: Frontend n'est pas disponible
    exit /b 1
  )
  echo   Tentative !cnt!/!max_fe!...
  timeout /t 5 /nobreak >nul
  goto wait_frontend
)
echo.

echo ===============================================
echo 🎉 Environnement Industria démarré !
echo ===============================================
echo.
echo 📋 Services disponibles :
echo    • Frontend: http://localhost:3000
echo    • Backend:  http://localhost:8080
echo    • Keycloak: http://keycloak:8081
echo    • DB:       localhost:5432
echo.
echo 🔧 Commandes utiles :
echo    • Voir les logs : docker compose logs -f [service]
echo    • Arrêter      : docker compose down
echo    • Redémarrer   : docker compose restart [service]
echo ===============================================
endlocal
