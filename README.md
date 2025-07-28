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

## Docker

A `docker-compose.yml` file is provided at the repository root. After installing Docker, you can build and run the project with:

```bash
docker compose up --build
```

The frontend map now uses OpenStreetMap tiles, so no access token is required.

This starts PostgreSQL, the API backend on port 8080 and the front-end on port 3000.
The front-end is built with `NEXT_PUBLIC_API_URL=http://localhost:8080` so your
browser can reach the API directly on the host. When using Docker, the frontend
server accesses the backend via `API_INTERNAL_URL=http://backend:8080`.
An optional Nginx proxy listens on port 80.
The backend adds CORS headers in each API route so the React app can call the API
without extra configuration.

### Domain model

The Spring Boot API uses JPA entities generated from the provided PlantUML
diagram. Key entities include `Zone`, `Parcel`, `Appointment` and supporting
reference tables like `Region` and `Activity`. Business rules such as automatic
status propagation between zones and parcels are handled in the service layer.

