# Industria Platform

[![Java](https://img.shields.io/badge/Java-21-orange.svg)](https://openjdk.java.net/projects/jdk/21/)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.2-brightgreen.svg)](https://spring.io/projects/spring-boot)
[![React](https://img.shields.io/badge/React-18-blue.svg)](https://reactjs.org/)
[![Next.js](https://img.shields.io/badge/Next.js-14-black.svg)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)

Plateforme numérique complète pour la gestion des zones industrielles, parcelles et investisseurs au Maroc.

## 📋 Table des matières

- [Vue d'ensemble](#vue-densemble)
- [Architecture](#architecture)
- [Technologies](#technologies)
- [Installation](#installation)
- [Développement](#développement)
- [Déploiement Docker](#déploiement-docker)
- [API Documentation](#api-documentation)
- [Modèle de données](#modèle-de-données)
- [Authentification](#authentification)
- [Fonctionnalités](#fonctionnalités)
- [Contribution](#contribution)

## 🎯 Vue d'ensemble

Industria Platform est une solution complète pour la gestion des zones industrielles permettant :

- **Gestion géospatiale** des zones et parcelles avec visualisation cartographique
- **Système de rendez-vous** entre investisseurs et gestionnaires de zones
- **Interface administrateur** pour la gestion des utilisateurs, zones et statistiques
- **Authentification SSO** via Keycloak avec gestion des rôles
- **Système d'audit** complet pour traçabilité
- **Exports CSV/Excel** pour les rapports administratifs

## 🏗️ Architecture

Le projet suit une architecture moderne à deux niveaux :

```
├── Front-End/           # Application React/Next.js
│   ├── src/
│   │   ├── app/         # Pages et routage (App Router)
│   │   ├── components/  # Composants réutilisables
│   │   └── lib/         # Utilitaires et API
└── backend/             # API Spring Boot
    ├── src/main/java/
    │   ├── controller/  # Contrôleurs REST
    │   ├── service/     # Logique métier
    │   ├── repository/  # Accès aux données
    │   ├── entity/      # Entités JPA
    │   └── dto/         # Objects de transfert
    └── src/main/resources/
```

## 🛠️ Technologies

### Backend
- **Java 21** - Langage principal
- **Spring Boot 3.2** - Framework principal
- **Spring Security 6** - Sécurité et authentification
- **Spring Data JPA** - Persistance des données
- **PostgreSQL** - Base de données principale
- **PostGIS** - Extension géospatiale
- **Keycloak** - Serveur d'authentification
- **Lombok** - Réduction du code boilerplate
- **Maven** - Gestion des dépendances

### Frontend
- **React 18** - Bibliothèque d'interface utilisateur
- **Next.js 14** - Framework React avec App Router
- **TypeScript** - Langage typé
- **Tailwind CSS** - Framework CSS utilitaire
- **Leaflet** - Cartographie interactive
- **React Leaflet** - Intégration React pour Leaflet
- **Lucide React** - Icônes

### Infrastructure
- **Docker & Docker Compose** - Conteneurisation
- **Nginx** - Serveur web (production)
- **OpenStreetMap** - Tuiles cartographiques

## 🚀 Installation

### Prérequis
- Java 21+
- Node.js 18+
- Docker & Docker Compose
- PostgreSQL (si exécution locale)

### Installation des dépendances

```bash
# Frontend
cd Front-End
npm install

# Backend
cd ../backend
./mvnw install -DskipTests
```

## 💻 Développement

### Démarrage rapide avec Docker

```bash
# Démarrer tous les services
docker compose up --build

# Initialiser les données de test (terminal séparé)
./scripts/init_db.sh    # Linux/Mac
scripts\init_db.bat     # Windows
```

Services disponibles :
- **Frontend** : http://localhost:3000
- **API Backend** : http://localhost:8080
- **Keycloak** : http://localhost:8081
- **PostgreSQL** : localhost:5432

### Développement local

```bash
# Terminal 1 - Backend
cd backend
./mvnw spring-boot:run

# Terminal 2 - Frontend
cd Front-End
npm run dev
```

### Variables d'environnement

Créer un fichier `.env.local` dans `Front-End/` :

```env
NEXT_PUBLIC_API_URL=http://localhost:8080
API_INTERNAL_URL=http://localhost:8080
```

## 🐳 Déploiement Docker

### Production

```bash
# Construction et démarrage
docker compose -f docker-compose.prod.yml up --build -d

# Vérification des logs
docker compose logs -f
```

### Configuration des volumes

Les données PostgreSQL et Keycloak sont persistées via des volumes Docker :
- `postgres_data` - Données de base
- `keycloak_data` - Configuration Keycloak

## 📚 API Documentation

### Endpoints principaux

#### Publics (sans authentification)
```
GET  /api/zones           # Liste des zones
GET  /api/zones/{id}      # Détails d'une zone
GET  /api/parcels         # Liste des parcelles
GET  /api/map/zones       # Données cartographiques
POST /api/public/appointments # Création rendez-vous
```

#### Authentifiés (JWT requis)
```
POST /api/zones           # Création zone (ZONE_MANAGER+)
PUT  /api/zones/{id}      # Modification zone
POST /api/parcels         # Création parcelle
GET  /api/admin/*         # Interface admin (ADMIN only)
```

### Réponses API

```typescript
// Structure standard des listes
interface ListResponse<T> {
  items: T[];
  totalElements: number;
  totalPages: number;
  page: number;
  limit: number;
}

// Gestion d'erreur
interface ErrorResponse {
  message: string;
  timestamp: string;
  status: number;
}
```

## 🗄️ Modèle de données

### Entités principales

#### Zone
```sql
zones (
  id VARCHAR PRIMARY KEY,
  name VARCHAR NOT NULL,
  description TEXT,
  address VARCHAR,
  total_area DOUBLE,
  price DOUBLE,
  price_type VARCHAR,
  status VARCHAR,
  geometry TEXT,          -- Format WKT
  latitude DOUBLE,        -- WGS84
  longitude DOUBLE,       -- WGS84
  region_id VARCHAR,
  zone_type_id VARCHAR,
  created_by VARCHAR,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)
```

#### Parcel
```sql
parcels (
  id VARCHAR PRIMARY KEY,
  reference VARCHAR,
  area DOUBLE,
  status VARCHAR,
  is_showroom BOOLEAN,
  cos DOUBLE,             -- Coefficient occupation sol
  cus DOUBLE,             -- Coefficient utilisation sol
  height_limit DOUBLE,    -- Limite hauteur (m)
  setback DOUBLE,         -- Recul obligatoire (m)
  geometry TEXT,
  zone_id VARCHAR,
  created_by VARCHAR
)
```

### Relations
- Une **Zone** contient plusieurs **Parcelles**
- Un **Utilisateur** peut créer plusieurs **Zones/Parcelles**
- Une **Parcelle** peut avoir plusieurs **Rendez-vous**
- Historique complet via **AuditLog**

## 🔐 Authentification

### Keycloak Configuration

Realm: `industria`
- URL: http://localhost:8081
- Admin: admin/admin

### Comptes de test
```
admin@industria.ma / password123     (ADMIN)
manager@industria.ma / password123   (ZONE_MANAGER)  
demo@entreprise.ma / password123     (USER)
```

### Rôles et permissions

| Rôle | Zones | Parcelles | Admin | Audit |
|------|-------|-----------|-------|-------|
| USER | Lecture | Lecture | ❌ | ❌ |
| ZONE_MANAGER | CRUD (siennes) | CRUD (siennes) | Partiel | ❌ |
| ADMIN | CRUD (toutes) | CRUD (toutes) | ✅ | ✅ |

## ✨ Fonctionnalités

### 🗺️ Cartographie
- Visualisation interactive des zones et parcelles
- Support des coordonnées Lambert Maroc (EPSG:26191)
- Conversion automatique WGS84 pour affichage web
- Tuiles OpenStreetMap

### 📊 Administration
- Dashboard avec statistiques temps réel
- Gestion utilisateurs avec rôles
- Export CSV/Excel des données
- Système d'audit complet
- Gestion des demandes de contact et rendez-vous

### 🔍 Recherche et filtrage
- Recherche textuelle zones/parcelles
- Filtres par région, statut, type
- Pagination optimisée
- Cache intelligent côté client

### 📧 Notifications
- Emails automatiques (confirmations, notifications)
- Templates HTML personnalisables
- Gestion des statuts de rendez-vous

## 🤝 Contribution

### Standards de code

#### Backend (Java)
- **Lombok** pour réduire le boilerplate
- **JavaDoc** obligatoire pour classes et méthodes publiques
- Tests unitaires avec JUnit 5
- Format : Google Java Style

#### Frontend (TypeScript)
- **TypeScript strict** activé
- **ESLint + Prettier** pour le formatage
- Composants fonctionnels avec hooks
- Props interfaces typées

### Workflow Git
```bash
# Créer une branche feature
git checkout -b feature/nom-fonctionnalite

# Commit avec convention
git commit -m "feat: ajout authentification SSO"

# Types: feat, fix, docs, style, refactor, test, chore
```

### Tests
```bash
# Backend
./mvnw test

# Frontend  
npm test
npm run test:e2e
```

## 📝 License

Ce projet est sous licence MIT. Voir le fichier [LICENSE](LICENSE) pour plus de détails.

## 🆘 Support

Pour toute question ou problème :
1. Vérifier les [Issues existantes](../../issues)
2. Créer une nouvelle issue avec les détails du problème
3. Inclure les logs et la configuration

---

**Industria Platform** - Développé avec ❤️ pour la digitalisation industrielle du Maroc