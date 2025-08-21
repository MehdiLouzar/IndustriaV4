# 📁 INDEX FRONT-END - INDUSTRIA V4

## 🏗️ Structure générale

L'application **Industria V4** est une plateforme B2B moderne développée avec **Next.js 15**, **React 19** et **TypeScript**. Elle propose un système de réservation de zones industrielles au Maroc avec une interface responsive et des fonctionnalités avancées de cartographie.

### Technologies principales
- **Framework** : Next.js 15 (App Router) avec rendu hybride SSR/CSR
- **UI** : React 19, TailwindCSS, Radix UI
- **Cartes** : Leaflet, MapLibre GL, React Leaflet
- **Authentification** : NextAuth.js avec JWT
- **Internationalisation** : react-i18next (FR/EN)
- **État** : Context API + hooks personnalisés
- **Optimisation** : Cache intelligent, virtualisation, lazy loading

---

## 📄 Pages (src/app/)

### 🏠 Page d'accueil
- **`/page.tsx`** - Landing page principale avec recherche de zones, vue carte/grille, sections CTA et avantages
- **`/layout.tsx`** - Layout racine avec métadonnées SEO, providers i18n et styles globaux
- **`/globals.css`** - Styles CSS globaux TailwindCSS et variables CSS personnalisées
- **`/ClientBody.tsx`** - Wrapper client pour gestion côté navigateur

### 🔐 Authentification (`/auth/`)
- **`/auth/login/page.tsx`** - Page de connexion utilisateur
- **`/auth/register/page.tsx`** - Page d'inscription nouvelle entreprise

### 🏭 Zones industrielles (`/zones/`)
- **`/zones/[id]/page.tsx`** - Page détaillée d'une zone avec localisation, équipements et prise de rendez-vous

### 👤 Utilisateur
- **`/profile/page.tsx`** - Profil utilisateur et gestion du compte
- **`/contact/page.tsx`** - Formulaire de contact entreprise

### 📊 Simulateurs d'investissement (`/simulateur/`)
- **`/simulateur/layout.tsx`** - Layout commun pour les simulateurs avec métadonnées SEO
- **`/simulateur/principal/page.tsx`** - Simulateur Charte d'Investissement (Axe 1 - Primes principales)
- **`/simulateur/secondaire/page.tsx`** - Simulateur Axe 2 (Mesures d'amélioration du climat des affaires)

### 📰 Contenu éditorial
#### Actualités et médias (`/media/`, `/actualites/`, `/evenements/`)
- **`/actualites/page.tsx`** - Liste des actualités sectorielles
- **`/evenements/page.tsx`** - Calendrier des événements industriels
- **`/media/actualites/page.tsx`** - Centre de presse - actualités
- **`/media/communiques/page.tsx`** - Communiqués de presse officiels
- **`/media/rapports/page.tsx`** - Rapports annuels et études
- **`/mediatheque/page.tsx`** - Bibliothèque multimédia

#### Le Groupe (`/groupe/`)
- **`/groupe/a-propos/page.tsx`** - Présentation de l'entreprise Industria
- **`/groupe/chiffres/page.tsx`** - Chiffres clés et statistiques
- **`/groupe/engagement/page.tsx`** - Engagements RSE et durabilité
- **`/groupe/emplois/page.tsx`** - Offres d'emploi actuelles
- **`/groupe/candidature/page.tsx`** - Formulaire de candidature spontanée
- **`/groupe/recrutement/page.tsx`** - Process de recrutement et culture d'entreprise

### 🛡️ Administration (`/admin/`)
- **`/admin/layout.tsx`** - Layout admin avec authentification et navigation dédiée
- **`/admin/page.tsx`** - Dashboard principal avec métriques et aperçus
- **`/admin/zones/page.tsx`** - Gestion CRUD des zones industrielles
- **`/admin/regions/page.tsx`** - Administration des régions géographiques
- **`/admin/countries/page.tsx`** - Gestion des pays (support international)
- **`/admin/zone-types/page.tsx`** - Types de zones (industrielle, logistique, franche)
- **`/admin/construction-types/page.tsx`** - Types de construction autorisés
- **`/admin/activities/page.tsx`** - Activités économiques autorisées
- **`/admin/amenities/page.tsx`** - Équipements et services disponibles
- **`/admin/parcels/page.tsx`** - Gestion des parcelles individuelles
- **`/admin/users/page.tsx`** - Administration des comptes utilisateurs
- **`/admin/appointments/page.tsx`** - Gestion des rendez-vous clients
- **`/admin/contact-requests/page.tsx`** - Traitement des demandes de contact
- **`/admin/notifications/page.tsx`** - Système de notifications push
- **`/admin/reports/page.tsx`** - Génération de rapports et exports
- **`/admin/audit-logs/page.tsx`** - Logs d'audit et traçabilité

---

## 🧩 Composants (src/components/)

### 🎯 Composants métier principaux
- **`Header.tsx`** - En-tête avec navigation, authentification et sélecteur de langue
- **`Footer.tsx`** - Pied de page avec liens légaux et contact
- **`SearchBar.tsx`** - Recherche avancée multi-critères (région, type, prix, surface)
- **`ZoneCard.tsx`** - Carte d'affichage d'une zone avec photo, détails et actions
- **`ZoneCard_fixed.tsx`** - Version corrigée avec optimisations de performance
- **`ZoneGrid.tsx`** - Grille responsive de zones avec pagination
- **`ZoneGridInfinite.tsx`** - Grille avec défilement infini et virtualisation
- **`ZoneMap.tsx`** - Carte interactive des zones avec clustering
- **`HomeMapView.tsx`** - Vue carte optimisée pour la page d'accueil
- **`MapView.tsx`** - Composant carte générique réutilisable

### 🎛️ Composants d'interface
- **`ViewToggle.tsx`** - Basculement vue grille/carte
- **`SearchBar.tsx`** - Interface de filtrage avec autocomplétion
- **`Pagination.tsx`** - Pagination avec navigation et infos de page
- **`VirtualizedTable.tsx`** - Table virtualisée pour grandes listes (admin)
- **`LoadingSpinner.tsx`** - Indicateurs de chargement animés
- **`DynamicIcon.tsx`** - Rendu d'icônes Lucide avec chargement dynamique

### 🛡️ Composants d'authentification et sécurité
- **`AdminGuard.tsx`** - Protection des routes admin avec vérification des permissions
- **`AdminHeader.tsx`** - En-tête spécialisé pour l'interface d'administration
- **`AuthButton.tsx`** - Bouton de connexion/déconnexion avec gestion d'état
- **`Providers.tsx`** - Providers de contexte (i18n, authentification, monitoring)

### 🔧 Composants utilitaires
- **`LanguageSwitcher.tsx`** - Sélecteur de langue FR/EN avec persistance
- **`AppointmentForm.tsx`** - Formulaire de prise de rendez-vous avec validation
- **`DeleteConfirmDialog.tsx`** - Dialog de confirmation pour suppressions critiques

### 🎨 Composants UI (src/components/ui/)
Bibliothèque de composants basée sur **Radix UI** avec styles **TailwindCSS** :
- **`button.tsx`** - Boutons avec variants (primary, secondary, ghost, destructive)
- **`card.tsx`** - Cartes avec header, content et footer
- **`input.tsx`** - Champs de saisie avec validation visuelle
- **`select.tsx`** - Sélecteurs déroulants accessibles
- **`dialog.tsx`** - Modales et popups avec gestion focus
- **`alert-dialog.tsx`** - Dialogues d'alerte et confirmation
- **`form.tsx`** - Composants de formulaire avec react-hook-form
- **`badge.tsx`** - Badges informatifs avec variants de couleur
- **`tabs.tsx`** - Onglets accessibles avec navigation clavier
- **`sheet.tsx`** - Panneaux latéraux coulissants (mobile)
- **`navigation-menu.tsx`** - Menus de navigation avec sous-menus
- **`separator.tsx`** - Séparateurs visuels
- **`label.tsx`** - Labels de champs avec association
- **`textarea.tsx`** - Zones de texte multi-lignes
- **`radio-group.tsx`** - Groupes de boutons radio
- **`alert.tsx`** - Alertes et notifications

---

## 🎣 Hooks (src/hooks/)

### 📡 Hooks de données
- **`useApiCache.ts`** - Cache intelligent avec TTL et gestion mémoire pour appels API
- **`useInfiniteScroll.ts`** - Défilement infini avec détection de seuil et optimisations
- **`useOverpassPOI.ts`** - Récupération de points d'intérêt OpenStreetMap via Overpass API

### 🔧 Hooks utilitaires
- **`useDebounce.ts`** - Anti-rebond pour champs de recherche et événements fréquents
- **`useImageOptimization.ts`** - Optimisation du chargement d'images avec placeholders
- **`usePermissions.ts`** - Vérification des permissions utilisateur et gestion des rôles

---

## 🔧 Utilitaires (src/lib/)

### 🌐 API et réseau
- **`utils.ts`** - Fonctions utilitaires principales :
  - `cn()` - Fusion intelligente de classes CSS (clsx + tailwind-merge)
  - `fetchApi()` - Client API principal avec authentification JWT et gestion d'erreurs
  - `getBaseUrl()` - URL API adaptative selon l'environnement (SSR/client)
  - `downloadFile()` - Téléchargement sécurisé de fichiers avec authentification
  - `SecureApiCache` - Cache mémoire avec TTL, limite de taille et nettoyage automatique

- **`publicApi.ts`** - Client API pour données publiques sans authentification
- **`coordinates.ts`** - Utilitaires de conversion et transformation de coordonnées géospatiales
- **`emergency-monitor.ts`** - Système de monitoring et alertes pour surveillance applicative

### 🌍 Internationalisation
- **`translations.ts`** - Gestion centralisée des traductions et clés i18n
- **`i18n.ts`** - Configuration react-i18next avec chargement synchrone et persistance

---

## 🎨 Styles (src/styles/)

- **`globals.css`** - Styles globaux TailwindCSS, variables CSS et reset
- **`map.css`** - Styles spécifiques aux composants cartographiques (Leaflet)
- **`select-fix.css`** - Corrections CSS pour composants select et dropdown

---

## 🌍 Localisation (src/locales/)

### 📝 Fichiers de traduction
- **`fr/translation.json`** - Traductions françaises (langue par défaut)
- **`en/translation.json`** - Traductions anglaises
- **`i18n.ts`** - Configuration multilingue avec fallback et détection automatique

---

## ⚙️ Configuration

### 🔧 Fichiers de configuration racine
- **`next.config.js`** - Configuration Next.js (output standalone, images, TypeScript bypass)
- **`tailwind.config.ts`** - Palette de couleurs Industria, breakpoints et plugins
- **`postcss.config.mjs`** - Configuration PostCSS pour TailwindCSS
- **`tsconfig.json`** - Configuration TypeScript stricte avec alias de chemins
- **`components.json`** - Configuration Shadcn/ui pour génération de composants
- **`package.json`** - Dépendances, scripts et métadonnées projet

### 🛡️ Middleware et sécurité
- **`middleware.ts`** (racine) - Protection routes admin avec vérification token
- **`middleware/authMiddleware.ts`** - Logic métier d'authentification
- **`.env.local`** - Variables d'environnement (URLs API, clés, configuration)

### 🐳 Déploiement
- **`Dockerfile`** - Image Docker pour conteneurisation
- **`netlify.toml`** - Configuration déploiement Netlify avec redirections

### 🔍 Qualité de code
- **`eslint.config.mjs`** - Linting JavaScript/TypeScript avec règles Next.js
- **`biome.json`** - Configuration Biome pour formatage et analyse statique

---

## 🏃‍♂️ Workers et optimisations

- **`workers/geometryWorker.ts`** - Web Worker pour calculs géométriques lourds (projections, simplifications)

---

## 📊 Types TypeScript (src/types/)

- **`index.ts`** - Définitions centralisées des interfaces et types :
  - `ListResponse<T>` - Format standardisé pour réponses API paginées
  - Types métier (Zone, Region, User, etc.)
  - Types d'authentification et permissions

---

## 📁 Arborescence complète

```
Front-End/
├── 📄 Configuration
│   ├── next.config.js
│   ├── tailwind.config.ts
│   ├── package.json
│   ├── tsconfig.json
│   ├── eslint.config.mjs
│   ├── biome.json
│   ├── components.json
│   ├── Dockerfile
│   └── netlify.toml
│
├── 🔒 Middleware & Auth
│   ├── middleware.ts
│   └── src/middleware/authMiddleware.ts
│
├── 📦 Public Assets
│   └── public/logo.png
│
└── 💻 Source Code (src/)
    ├── 📱 App Pages (Next.js App Router)
    │   ├── layout.tsx + globals.css
    │   ├── page.tsx (Accueil)
    │   ├── auth/ (login, register)
    │   ├── zones/[id]/ (Détails zone)
    │   ├── admin/ (13 pages d'administration)
    │   ├── groupe/ (6 pages institutionnelles)
    │   ├── media/ (3 sections presse)
    │   └── contact/, profile/, actualites/, evenements/
    │
    ├── 🧩 Components
    │   ├── 🎯 Métier (Header, SearchBar, Zone*, Map*)
    │   ├── 🛡️ Auth (AdminGuard, AuthButton)
    │   ├── 🔧 Utils (LoadingSpinner, Pagination, ViewToggle)
    │   └── 🎨 UI Library (15+ composants Radix UI)
    │
    ├── 🎣 Hooks
    │   ├── useApiCache.ts (Cache intelligent)
    │   ├── useInfiniteScroll.ts (Performance)
    │   ├── usePermissions.ts (Sécurité)
    │   └── 3 autres hooks spécialisés
    │
    ├── 🔧 Libraries
    │   ├── utils.ts (Client API, cache, utilitaires)
    │   ├── publicApi.ts (API publique)
    │   ├── coordinates.ts (Géospatial)
    │   ├── translations.ts (i18n)
    │   └── emergency-monitor.ts (Monitoring)
    │
    ├── 🌍 Internationalization
    │   ├── i18n.ts
    │   └── locales/ (FR + EN)
    │
    ├── 🎨 Styles
    │   ├── globals.css (TailwindCSS)
    │   ├── map.css (Leaflet)
    │   └── select-fix.css
    │
    ├── 📊 Types
    │   └── index.ts
    │
    └── 🏃‍♂️ Workers
        └── geometryWorker.ts
```

---

## 🎯 Points clés de l'architecture

### ⚡ Performance
- Lazy loading des composants lourds (cartes, grilles)
- Cache API intelligent avec TTL et gestion mémoire
- Virtualisation des listes longues
- Web Workers pour calculs géométriques
- Optimisation des images avec placeholders

### 🛡️ Sécurité
- Authentification JWT avec refresh automatique
- Protection des routes admin par middleware
- Validation TypeScript stricte
- Cache sécurisé avec limites de taille
- Monitoring d'urgence

### 📱 Responsive & Accessibility
- Design mobile-first avec TailwindCSS
- Composants Radix UI accessibles (ARIA, clavier)
- Navigation adaptative (menu hamburger, sheets)
- Support touch et gestures

### 🌐 Internationalisation
- Support FR/EN avec react-i18next
- Détection automatique de langue
- Persistance des préférences utilisateur
- Traductions contextuelles

Cette architecture modulaire et scalable permet un développement efficace et une maintenance aisée de la plateforme B2B Industria.