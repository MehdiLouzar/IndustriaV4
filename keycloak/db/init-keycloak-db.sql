-- db/init-keycloak-db.sql
-- Script d'initialisation pour créer la base de données Keycloak

-- Créer la base de données Keycloak
CREATE DATABASE keycloak;

-- Créer un utilisateur spécifique pour Keycloak (optionnel, meilleure pratique)
-- CREATE USER keycloak_user WITH ENCRYPTED PASSWORD 'keycloak_password';
-- GRANT ALL PRIVILEGES ON DATABASE keycloak TO keycloak_user;

-- Se connecter à la base de données Keycloak pour la préparer
\c keycloak;

-- Créer les extensions PostgreSQL nécessaires (si besoin)
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Message de confirmation
SELECT 'Base de données Keycloak initialisée avec succès' as message;