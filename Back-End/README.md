# Next.js API Backend

This directory contains the Next.js backend exposing API routes for the industrial zones application.

## Development

```bash
npm install
npm run db:generate
npm run db:push
npm run db:seed  # optional
npm run dev
```

The server listens on port 3001 by default and connects to PostgreSQL using `DATABASE_URL`.

### CORS

Every API handler adds permissive CORS headers using a small helper. Requests from
the frontend running on `localhost:3000` therefore succeed without additional
configuration.

## Populate the database with initDB.sql

A helper script is provided to run the SQL file located in `db/init/initDB.sql`.
The helper will use the local `psql` command when available. If not, it falls
back to running `psql` inside the `db` service defined in `docker-compose.yml`.
Connection parameters can be customised via `DB_HOST`, `DB_PORT`, `DB_USER` and
`DB_NAME`. The script defaults to the `postgres` password when `PGPASSWORD`
is not set.

```bash
./scripts/run_initdb.sh    # Linux/macOS
# Windows helpers work even with restrictive execution policies
./scripts/run_initdb.bat
# powershell -ExecutionPolicy Bypass -File .\scripts\run_initdb.ps1
```

If you get a message that script execution is disabled, open a PowerShell
terminal as admin and run:

```powershell
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
```

Alternatively you can run the same SQL using the Node helper:

```bash
npm run db:init
```

After running the script you can sign in with the following demo accounts:

```
- admin@zonespro.ma / password123
- manager@zonespro.ma / password123
- demo@entreprise.ma / password123
```
The SQL file also fills `zone_vertices` and `parcel_vertices` with Lambert
coordinates so polygons can be drawn for each zone and parcel. Trigger
functions keep `latitude` and `longitude` fields updated whenever `lambertX`
or `lambertY` change. Extra triggers recompute these GPS fields whenever a
vertex is inserted, updated or removed so the centroid stays consistent with
the polygon shape.

Coordinate conversions use the official Lambert Nord Maroc projection
(EPSG:26191) with the datum shift so results match PostGIS exactly.
**The central meridian is `-5.4`; using `-5` yields points nearly 50&nbsp;km
away.** Helper utilities return `[longitude, latitude]` to avoid confusion when
building GeoJSON features.

