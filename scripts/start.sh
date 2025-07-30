#!/bin/bash
# Script de démarrage complet pour l'environnement Industria
set -euo pipefail

echo "🚀 Démarrage de l'environnement Industria..."

# Nettoyage des conteneurs existants
echo "🧹 Nettoyage des conteneurs existants..."
docker compose down -v --remove-orphans

# Construction et démarrage des services
echo "🔨 Construction et démarrage des services..."
docker compose up --build -d

# Fonction d'attente avec timeout
wait_for_service() {
    local service_name=$1
    local health_url=$2
    local max_attempts=60
    local attempt=1
    
    echo "⏳ Attente du service $service_name..."
    
    while [ $attempt -le $max_attempts ]; do
        if curl -sf "$health_url" > /dev/null 2>&1; then
            echo "✅ $service_name est prêt !"
            return 0
        fi
        
        echo "   Tentative $attempt/$max_attempts..."
        sleep 5
        ((attempt++))
    done
    
    echo "❌ Timeout: $service_name n'est pas disponible après $((max_attempts * 5)) secondes"
    return 1
}

# Attendre que PostgreSQL soit prêt
echo "⏳ Attente de PostgreSQL..."
while ! docker compose exec -T db pg_isready -U postgres > /dev/null 2>&1; do
    echo "   PostgreSQL pas encore prêt..."
    sleep 2
done
echo "✅ PostgreSQL est prêt !"

# Attendre Keycloak
wait_for_service "Keycloak" "http://localhost:8081/realms/industria"

# Attendre le backend
wait_for_service "Backend" "http://localhost:8080/actuator/health"

# Attendre que l'initialisation des données soit terminée
echo "⏳ Attente de l'initialisation des données..."
while docker compose ps db-init | grep -q "running\|restarting"; do
    echo "   Initialisation des données en cours..."
    sleep 3
done

# Vérifier le statut de l'initialisation
if docker compose ps db-init | grep -q "exited (0)"; then
    echo "✅ Initialisation des données terminée avec succès !"
else
    echo "❌ Problème lors de l'initialisation des données"
    echo "📜 Logs de l'initialisation :"
    docker compose logs db-init
fi

# Attendre le frontend
wait_for_service "Frontend" "http://localhost:3000"

echo ""
echo "🎉 Tous les services sont démarrés avec succès !"
echo ""
echo "📋 Services disponibles :"
echo "   • Frontend:  http://localhost:3000"
echo "   • Backend:   http://localhost:8080"
echo "   • Keycloak:  http://localhost:8081"
echo "   • Database:  localhost:5432"
echo ""
echo "👤 Comptes de test :"
echo "   • Admin:    admin@zonespro.ma / password123"
echo "   • Manager:  manager@zonespro.ma / password123"
echo "   • User:     demo@entreprise.ma / password123"
echo ""
echo "🔧 Commandes utiles :"
echo "   • Voir les logs: docker compose logs -f [service]"
echo "   • Arrêter:      docker compose down"
echo "   • Redémarrer:   docker compose restart [service]"
echo ""

# Afficher les logs des services en arrière-plan
echo "📜 Logs des services (Ctrl+C pour arrêter l'affichage) :"
docker compose logs -f