@echo off
REM Script de création des utilisateurs Keycloak pour Industria
REM Usage: setup-keycloak-users.bat [dev|prod]

setlocal enabledelayedexpansion

set ENVIRONMENT=%1
if "%ENVIRONMENT%"=="" set ENVIRONMENT=dev
set PROJECT_NAME=industria
set KEYCLOAK_URL=http://localhost:8081
set REALM_NAME=industria

echo.
echo 👤 Configuration des utilisateurs Keycloak pour: %ENVIRONMENT%
echo.

REM Vérifier que curl est disponible
curl --version >nul 2>&1
if errorlevel 1 (
    echo ❌ curl n'est pas disponible
    echo 📝 Installez curl ou utilisez PowerShell à la place
    pause
    exit /b 1
)

REM Vérifier que Keycloak est accessible
echo 🔍 Vérification de l'accès à Keycloak...
curl -f %KEYCLOAK_URL%/health/ready >nul 2>&1
if errorlevel 1 (
    echo ❌ Keycloak n'est pas accessible sur %KEYCLOAK_URL%
    echo 📝 Assurez-vous que les conteneurs sont démarrés
    echo 📝 Commande: docker-compose -p %PROJECT_NAME% up -d
    pause
    exit /b 1
)

REM Lire les variables d'environnement
if "%ENVIRONMENT%"=="prod" (
    if not exist ".env.prod" (
        echo ❌ Fichier .env.prod introuvable!
        echo 📝 Créez le fichier .env.prod avec KEYCLOAK_ADMIN_PASSWORD
        pause
        exit /b 1
    )
    
    REM Lire le mot de passe depuis .env.prod
    for /f "tokens=2 delims==" %%a in ('findstr "KEYCLOAK_ADMIN_PASSWORD" .env.prod') do set KEYCLOAK_ADMIN_PASSWORD=%%a
    if "!KEYCLOAK_ADMIN_PASSWORD!"=="" (
        echo ❌ KEYCLOAK_ADMIN_PASSWORD non trouvé dans .env.prod
        pause
        exit /b 1
    )
) else (
    set KEYCLOAK_ADMIN_PASSWORD=admin123
)

echo ✅ Keycloak accessible

REM Obtenir le token d'accès admin
echo 🔐 Authentification admin...
for /f "usebackq delims=" %%i in (`powershell -NoProfile -Command "(Invoke-RestMethod -Method Post -Uri '%KEYCLOAK_URL%/realms/master/protocol/openid-connect/token' -Body 'username=admin&password=!KEYCLOAK_ADMIN_PASSWORD!&grant_type=password&client_id=admin-cli' -ContentType 'application/x-www-form-urlencoded').access_token"`) do set "ACCESS_TOKEN=%%i"

if "!ACCESS_TOKEN!"=="" (
    echo ❌ Impossible d'obtenir le token d'accès
    echo 📝 Vérifiez les identifiants admin
    pause
    exit /b 1
)

echo ✅ Token d'accès obtenu

REM Vérifier si le realm existe
echo 🔍 Vérification du realm '%REALM_NAME%'...
curl -s -H "Authorization: Bearer !ACCESS_TOKEN!" "%KEYCLOAK_URL%/admin/realms/%REALM_NAME%" >nul 2>&1
if errorlevel 1 (
    echo ❌ Le realm '%REALM_NAME%' n'existe pas
    echo 📝 Importez d'abord le realm depuis keycloak\realm-industria.json
    pause
    exit /b 1
)

echo ✅ Realm '%REALM_NAME%' trouvé

REM Fonction pour créer un utilisateur
:create_user
set USERNAME=%1
set EMAIL=%2
set FIRST_NAME=%3
set LAST_NAME=%4
set PASSWORD=%5
set ROLE=%6

echo.
echo 👤 Création de l'utilisateur: %USERNAME%

REM Créer l'utilisateur
curl -s -X POST "%KEYCLOAK_URL%/admin/realms/%REALM_NAME%/users" ^
-H "Authorization: Bearer !ACCESS_TOKEN!" ^
-H "Content-Type: application/json" ^
-d "{\"username\":\"%USERNAME%\",\"email\":\"%EMAIL%\",\"firstName\":\"%FIRST_NAME%\",\"lastName\":\"%LAST_NAME%\",\"enabled\":true,\"emailVerified\":true}"

if errorlevel 1 (
    echo ❌ Erreur lors de la création de l'utilisateur %USERNAME%
    goto :eof
)

REM Obtenir l'ID de l'utilisateur créé
for /f "usebackq tokens=*" %%i in (`curl -s -H "Authorization: Bearer !ACCESS_TOKEN!" "%KEYCLOAK_URL%/admin/realms/%REALM_NAME%/users?username=%USERNAME%" ^| findstr /C:"id" ^| for /f "tokens=2 delims=:" %%j in ('more') do @echo %%j ^| for /f "tokens=1 delims=," %%k in ('more') do @echo %%k`) do set USER_ID=%%i
set USER_ID=!USER_ID:"=!

if "!USER_ID!"=="" (
    echo ❌ Impossible de récupérer l'ID de l'utilisateur %USERNAME%
    goto :eof
)

REM Définir le mot de passe
curl -s -X PUT "%KEYCLOAK_URL%/admin/realms/%REALM_NAME%/users/!USER_ID!/reset-password" ^
-H "Authorization: Bearer !ACCESS_TOKEN!" ^
-H "Content-Type: application/json" ^
-d "{\"type\":\"password\",\"value\":\"%PASSWORD%\",\"temporary\":false}"

REM Assigner le rôle si spécifié
if not "%ROLE%"=="" (
    REM Obtenir l'ID du rôle
    for /f "usebackq tokens=*" %%i in (`curl -s -H "Authorization: Bearer !ACCESS_TOKEN!" "%KEYCLOAK_URL%/admin/realms/%REALM_NAME%/roles/%ROLE%" ^| findstr /C:"id" ^| for /f "tokens=2 delims=:" %%j in ('more') do @echo %%j ^| for /f "tokens=1 delims=," %%k in ('more') do @echo %%k`) do set ROLE_ID=%%i
    set ROLE_ID=!ROLE_ID:"=!
    
    if not "!ROLE_ID!"=="" (
        curl -s -X POST "%KEYCLOAK_URL%/admin/realms/%REALM_NAME%/users/!USER_ID!/role-mappings/realm" ^
        -H "Authorization: Bearer !ACCESS_TOKEN!" ^
        -H "Content-Type: application/json" ^
        -d "[{\"id\":\"!ROLE_ID!\",\"name\":\"%ROLE%\"}]"
    )
)

echo ✅ Utilisateur %USERNAME% créé avec succès
goto :eof

REM Créer les utilisateurs de test
echo.
echo 📝 Création des utilisateurs de test...

call :create_user "admin" "admin@zonespro.ma" "Admin" "Système" "Admin@123!" "ADMIN"
call :create_user "manager" "manager@zonespro.ma" "Manager" "Zone" "Manager@123!" "ZONE_MANAGER"
call :create_user "demo" "demo@entreprise.ma" "Demo" "User" "Demo@123!" "USER"

echo.
echo ========================================
echo ✅ Configuration des utilisateurs terminée!
echo ========================================
echo.
echo 👤 Utilisateurs créés dans le realm '%REALM_NAME%':
echo.
echo    🔐 admin@zonespro.ma (ADMIN)
echo       Mot de passe: Admin@123!
echo.
echo    👨‍💼 manager@zonespro.ma (ZONE_MANAGER)  
echo       Mot de passe: Manager@123!
echo.
echo    👤 demo@entreprise.ma (USER)
echo       Mot de passe: Demo@123!
echo.
echo 🌐 Console Keycloak: %KEYCLOAK_URL%
echo    Realm: %REALM_NAME%
echo.
echo 📝 Les utilisateurs peuvent maintenant se connecter à l'application.
echo.

echo Appuyez sur une touche pour continuer...
pause >nul
