#!/usr/bin/env bash
# start.sh — Démarrage de l'environnement Industria (bash)

set -euo pipefail

echo
echo "==============================================="
echo "🚀 Démarrage de l'environnement Industria..."
echo "==============================================="
echo

# Vérifier la présence de Docker et Docker Compose
if ! command -v docker >/dev/null 2>&1; then
  echo "❌ Docker n'est pas installé ou non accessible"
  exit 1
fi
if ! docker compose version >/dev/null 2>&1; then
  echo "❌ Docker Compose n'est pas installé ou non accessible"
  exit 1
fi
echo "✅ Docker et Docker Compose détectés"
echo

# Nettoyage des conteneurs existants
echo "🧹 Nettoyage des conteneurs existants..."
docker compose down -v --remove-orphans
echo

# Construction et démarrage des services
echo "🔨 Construction et démarrage des services..."
docker compose up --build -d
echo

# Helpers d'attente HTTP
wait_for_service() {
  local name=$1 url=$2 max=60
  echo "⏳ Attente de $name..."
  for i in $(seq 1 $max); do
    if curl -sf "$url" >/dev/null 2>&1; then
      echo "✅ $name est prêt !"
      return 0
    fi
    printf "   Tentative %2d/%d...\r" "$i" "$max"
    sleep 5
  done
  echo
  echo "❌ Timeout: $name n'est pas dispo après $((max*5))s"
  exit 1
}

# Attendre PostgreSQL
echo "⏳ Attente de PostgreSQL..."
until docker compose exec -T db pg_isready -U postgres >/dev/null 2>&1; do
  echo "   PostgreSQL pas encore prêt..."
  sleep 2
done
echo "✅ PostgreSQL est prêt !"
echo

# Attendre Keycloak
wait_for_service "Keycloak" "http://keycloak:8081/realms/industria"
echo

# Attendre Backend
wait_for_service "Backend" "http://localhost:8080/actuator/health"
echo

# Attendre Frontend
wait_for_service "Frontend" "http://localhost:3000"
echo

echo "==============================================="
echo "🎉 Tous les services sont démarrés !"
echo "-----------------------------------------------"
echo "• Frontend: http://localhost:3000"
echo "• Backend:  http://localhost:8080"
echo "• Keycloak: http://keycloak:8081"
echo "• DB:       localhost:5432"
echo "==============================================="
echo
echo "🔧 Commandes utiles :"
echo "   • Voir les logs : docker compose logs -f [service]"
echo "   • Arrêter      : docker compose down"
echo "   • Redémarrer   : docker compose restart [service]"
echo
