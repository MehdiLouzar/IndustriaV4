# Industria Platform

The project is split into two folders:

- `Front-End` – React application built with Next.js (static export)
- `backend` – Spring Boot API exposing the data layer

## Development

1. Install dependencies:

```bash
cd Front-End && npm install
cd ../backend && ./mvnw install -DskipTests
```

2. Build the backend JAR:

```bash
cd backend
./mvnw package -DskipTests
```

3. Start both apps during development (in separate terminals):

```bash
npm run dev       # from Front-End
./mvnw spring-boot:run # from backend
```

API routes are available under `/api` and provide zone and parcel data used by the React components.
All `GET` endpoints under `/api` are publicly accessible, while modifying requests require a valid JWT issued by Keycloak.

## Docker

A `docker-compose.yml` file is provided at the repository root. After installing Docker, you can build and run the project with:

```bash
docker compose up --build
```

The frontend map now uses OpenStreetMap tiles, so no access token is required.

This starts PostgreSQL, Keycloak, the API backend on port 8080 and the front-end on port 3000.
The front-end is built with `NEXT_PUBLIC_API_URL=http://localhost:8080` so your browser can reach the API directly on the host. When using Docker, the frontend server accesses the backend via `API_INTERNAL_URL=http://backend:8080`.

### Sample data

After starting the backend once so Hibernate can create the schema, you can
load the sample dataset with the helper script:
```bash
./scripts/init_db.sh
```
On Windows use:
```bat
scripts\init_db.bat
```
The script runs `psql` inside the PostgreSQL container started by Docker Compose.
It checks whether any users already exist and only runs `backend/db/init/initDB.sql`
when needed. By default it connects to the service named `db`. You can override the
container name and credentials with the environment variables `DB_CONTAINER`,
`DB_NAME`, `DB_USER` and `DB_PASSWORD`.
The backend validates JWT tokens issued by Keycloak. A Keycloak container is
included in `docker-compose.yml` and exposes the realm `industria` on
`http://localhost:8081`. Default admin credentials are `admin/admin`.
When the container starts it imports `keycloak/realm-export.json` which defines
demo users matching the accounts shown on the login page:

```
- admin@industria.ma / password123 (ADMIN)
- manager@industria.ma / password123 (ZONE_MANAGER)
- demo@entreprise.ma / password123 (USER)
```
If you run Keycloak manually, pass `--import-realm` with the path to this file
to precreate these users.
The backend adds CORS headers in each API route so the React app can call the API
without extra configuration.

### Domain model

The Spring Boot API uses JPA entities generated from the provided PlantUML
diagram. Key entities include `Zone`, `Parcel`, `Appointment` and supporting
reference tables like `Region` and `Activity`. Business rules such as automatic
status propagation between zones and parcels are handled in the service layer.

