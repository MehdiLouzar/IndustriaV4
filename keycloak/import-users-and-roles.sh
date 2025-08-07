#!/bin/bash
set -e

# Connexion en tant qu'admin
/opt/keycloak/bin/kcadm.sh config credentials \
  --server http://localhost:8080 \
  --realm master \
  --user admin \
  --password admin

echo "✅ Authentification OK"

REALM="industria"

echo "➕ Création des utilisateurs..."

# 1. Admin
/opt/keycloak/bin/kcadm.sh create users -r $REALM \
  -s username=admin@industria.ma -s enabled=true \
  -s email=admin@industria.ma -s emailVerified=true \
  -s firstName=Administrateur -s lastName=industria

/opt/keycloak/bin/kcadm.sh set-password -r $REALM --username admin@industria.ma --new-password password123

/opt/keycloak/bin/kcadm.sh add-roles -r $REALM --uusername admin@industria.ma --rolename ADMIN

# 2. Manager
/opt/keycloak/bin/kcadm.sh create users -r $REALM \
  -s username=manager@industria.ma -s enabled=true \
  -s email=manager@industria.ma -s emailVerified=true \
  -s firstName=Manager -s lastName=Commercial

/opt/keycloak/bin/kcadm.sh set-password -r $REALM --username manager@industria.ma --new-password password123

/opt/keycloak/bin/kcadm.sh add-roles -r $REALM --uusername manager@industria.ma --rolename ZONE_MANAGER

# 3. Utilisateur démo
/opt/keycloak/bin/kcadm.sh create users -r $REALM \
  -s username=demo@entreprise.ma -s enabled=true \
  -s email=demo@entreprise.ma -s emailVerified=true \
  -s firstName=Utilisateur -s lastName=Démo

/opt/keycloak/bin/kcadm.sh set-password -r $REALM --username demo@entreprise.ma --new-password password123

/opt/keycloak/bin/kcadm.sh add-roles -r $REALM --uusername demo@entreprise.ma --rolename USER

echo "🎉 Tous les utilisateurs ont été créés et les rôles appliqués."
