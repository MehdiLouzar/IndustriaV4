#!/bin/bash

# Script de build et déploiement Keycloak
# Usage: ./build-keycloak.sh [dev|prod]

set -e

ENVIRONMENT=${1:-dev}
PROJECT_NAME="keycloak-industria"

echo "🚀 Déploiement Keycloak pour l'environnement: $ENVIRONMENT"

# Vérifier que le fichier realm existe
if [ ! -f "realm-industria.json" ]; then
    echo "❌ Fichier realm-industria.json introuvable!"
    echo "📝 Créez d'abord le fichier de configuration du realm."
    exit 1
fi

# Nettoyer les containers existants
echo "🧹 Nettoyage des containers existants..."
docker-compose -p $PROJECT_NAME down -v 2>/dev/null || true

# Builder l'image
echo "🔨 Construction de l'image Keycloak..."
docker build -t keycloak-industria:latest .

if [ "$ENVIRONMENT" = "prod" ]; then
    echo "🏭 Configuration pour PRODUCTION"
    
    # Utiliser le docker-compose de production
    export KC_DB=postgres
    export KC_HOSTNAME_STRICT=true
    export KC_HTTP_ENABLED=false
    export KC_HOSTNAME=yourdomain.com
    
    # Générer des mots de passe sécurisés
    export KEYCLOAK_ADMIN_PASSWORD=$(openssl rand -base64 32)
    export POSTGRES_PASSWORD=$(openssl rand -base64 32)
    
    echo "📋 Mots de passe générés:"
    echo "   Admin Keycloak: $KEYCLOAK_ADMIN_PASSWORD"
    echo "   PostgreSQL: $POSTGRES_PASSWORD"
    echo "   ⚠️  Sauvegardez ces mots de passe!"
    
    # Attendre confirmation
    read -p "🤔 Continuer avec la configuration production? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ Déploiement annulé"
        exit 1
    fi
else
    echo "🔧 Configuration pour DÉVELOPPEMENT"
    export KC_DB=h2
fi

# Lancer les services
echo "🚀 Lancement des services..."
docker-compose -p $PROJECT_NAME up -d

# Attendre que Keycloak soit prêt
echo "⏳ Attente du démarrage de Keycloak..."
timeout=300
count=0

while [ $count -lt $timeout ]; do
    if curl -f http://localhost:8080/health/ready >/dev/null 2>&1; then
        echo "✅ Keycloak est prêt!"
        break
    fi
    
    echo -n "."
    sleep 2
    count=$((count + 2))
done

if [ $count -ge $timeout ]; then
    echo "❌ Timeout: Keycloak n'a pas démarré dans les temps"
    docker-compose -p $PROJECT_NAME logs keycloak
    exit 1
fi

# Afficher les informations de connexion
echo ""
echo "🎉 Déploiement terminé avec succès!"
echo ""
echo "🔗 Accès Keycloak:"
echo "   URL: http://localhost:8080"
echo "   Admin: admin"
if [ "$ENVIRONMENT" = "prod" ]; then
    echo "   Password: $KEYCLOAK_ADMIN_PASSWORD"
else
    echo "   Password: admin123"
fi
echo ""
echo "🏢 Realm configuré: industria"
echo "👤 Utilisateurs de test:"
echo "   - admin@zonespro.ma (ADMIN)"
echo "   - manager@zonespro.ma (ZONE_MANAGER)"
echo "   - demo@entreprise.ma (USER)"
echo ""

if [ "$ENVIRONMENT" = "dev" ]; then
    echo "📧 MailHog (pour les emails de test):"
    echo "   URL: http://localhost:8025"
    echo ""
fi

echo "📊 Pour voir les logs:"
echo "   docker-compose -p $PROJECT_NAME logs -f"
echo ""
echo "🛑 Pour arrêter:"
echo "   docker-compose -p $PROJECT_NAME down"