#!/bin/bash
set -e

# Configuration
KEYCLOAK_SERVER="http://localhost:8080"
REALM="industria"
ADMIN_USER="admin"
ADMIN_PASSWORD="admin"

echo "🔐 Connexion à Keycloak..."

# Connexion en tant qu'admin
/opt/keycloak/bin/kcadm.sh config credentials --server $KEYCLOAK_SERVER --realm master --user $ADMIN_USER --password $ADMIN_PASSWORD

echo "✅ Authentification OK"
echo "➕ Création des utilisateurs..."

# 1. Admin
echo "👤 Création de l'utilisateur: admin@industria.ma"
/opt/keycloak/bin/kcadm.sh create users -r $REALM \
    -s username=admin@industria.ma \
    -s enabled=true \
    -s email=admin@industria.ma \
    -s emailVerified=true \
    -s firstName=Administrateur \
    -s lastName=Industria \
    -s 'credentials=[{"type":"password","value":"password123","temporary":false}]'

# Assigner le rôle ADMIN
/opt/keycloak/bin/kcadm.sh add-roles -r $REALM --uusername admin@industria.ma --rolename ADMIN

echo "✅ Utilisateur admin@industria.ma créé avec le rôle ADMIN"

# 2. Manager
echo "👤 Création de l'utilisateur: manager@industria.ma"
/opt/keycloak/bin/kcadm.sh create users -r $REALM \
    -s username=manager@industria.ma \
    -s enabled=true \
    -s email=manager@industria.ma \
    -s emailVerified=true \
    -s firstName=Manager \
    -s lastName=Commercial \
    -s 'credentials=[{"type":"password","value":"password123","temporary":false}]'

# Assigner le rôle ZONE_MANAGER
/opt/keycloak/bin/kcadm.sh add-roles -r $REALM --uusername manager@industria.ma --rolename ZONE_MANAGER

echo "✅ Utilisateur manager@industria.ma créé avec le rôle ZONE_MANAGER"

# 3. Utilisateur démo
echo "👤 Création de l'utilisateur: demo@entreprise.ma"
/opt/keycloak/bin/kcadm.sh create users -r $REALM \
    -s username=demo@entreprise.ma \
    -s enabled=true \
    -s email=demo@entreprise.ma \
    -s emailVerified=true \
    -s firstName=Utilisateur \
    -s lastName=Démo \
    -s 'credentials=[{"type":"password","value":"password123","temporary":false}]'

# Assigner le rôle USER
/opt/keycloak/bin/kcadm.sh add-roles -r $REALM --uusername demo@entreprise.ma --rolename USER

echo "✅ Utilisateur demo@entreprise.ma créé avec le rôle USER"

echo ""
echo "🎉 Tous les utilisateurs ont été créés et les rôles appliqués."
echo "📋 Utilisateurs créés:"
echo "   - admin@industria.ma (ADMIN)"
echo "   - manager@industria.ma (ZONE_MANAGER)"
echo "   - demo@entreprise.ma (USER)"
echo "🔑 Mot de passe par défaut: password123"