# keycloak/Dockerfile
FROM quay.io/keycloak/keycloak:24.0.4

# Variables d'environnement pour la configuration
ENV KC_DB=postgres
ENV KC_HOSTNAME_STRICT=false
ENV KC_HOSTNAME_STRICT_HTTPS=false
ENV KC_HTTP_ENABLED=true
ENV KC_HEALTH_ENABLED=true
ENV KC_METRICS_ENABLED=true

# Passer en mode root pour les configurations
USER root

# Créer les répertoires nécessaires
RUN mkdir -p /opt/keycloak/data/import && \
    mkdir -p /opt/keycloak/themes && \
    chown -R keycloak:keycloak /opt/keycloak/data && \
    chown -R keycloak:keycloak /opt/keycloak/themes

# Revenir à l'utilisateur keycloak
USER keycloak

# Pré-construire Keycloak pour améliorer les performances de démarrage
RUN /opt/keycloak/bin/kc.sh build

# Exposer le port
EXPOSE 8080

# Point d'entrée et commande par défaut
ENTRYPOINT ["/opt/keycloak/bin/kc.sh"]
