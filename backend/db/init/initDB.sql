-- db/init/initDB.sql
-- Simplified demo data for Industria using Prisma schema

CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Ensure newer columns exist when the database was created from an older schema
ALTER TABLE parcels
  ADD COLUMN IF NOT EXISTS "isFree" BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS "isShowroom" BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS cos FLOAT,
  ADD COLUMN IF NOT EXISTS cus FLOAT,
  ADD COLUMN IF NOT EXISTS latitude FLOAT,
  ADD COLUMN IF NOT EXISTS longitude FLOAT;

ALTER TABLE zones
  ADD COLUMN IF NOT EXISTS latitude FLOAT,
  ADD COLUMN IF NOT EXISTS longitude FLOAT;

-- Optional tables to store Lambert coordinates for drawing polygons
CREATE TABLE IF NOT EXISTS zone_vertices (
  "zoneId" TEXT NOT NULL REFERENCES zones(id) ON DELETE CASCADE,
  seq INT NOT NULL,
  "lambertX" FLOAT NOT NULL,
  "lambertY" FLOAT NOT NULL
);

CREATE TABLE IF NOT EXISTS parcel_vertices (
  "parcelId" TEXT NOT NULL REFERENCES parcels(id) ON DELETE CASCADE,
  seq INT NOT NULL,
  "lambertX" FLOAT NOT NULL,
  "lambertY" FLOAT NOT NULL
);

-- Functions to keep latitude/longitude in sync with Lambert coordinates
CREATE OR REPLACE FUNCTION update_zone_latlon() RETURNS TRIGGER AS $$
BEGIN
  IF NEW."lambertX" IS NOT NULL AND NEW."lambertY" IS NOT NULL THEN
    SELECT ST_Y(ST_Transform(ST_SetSRID(ST_MakePoint(NEW."lambertX", NEW."lambertY"),26191),4326)),
           ST_X(ST_Transform(ST_SetSRID(ST_MakePoint(NEW."lambertX", NEW."lambertY"),26191),4326))
      INTO NEW.latitude, NEW.longitude;
  ELSE
    NEW.latitude := NULL;
    NEW.longitude := NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_parcel_latlon() RETURNS TRIGGER AS $$
BEGIN
  IF NEW."lambertX" IS NOT NULL AND NEW."lambertY" IS NOT NULL THEN
    SELECT ST_Y(ST_Transform(ST_SetSRID(ST_MakePoint(NEW."lambertX", NEW."lambertY"),26191),4326)),
           ST_X(ST_Transform(ST_SetSRID(ST_MakePoint(NEW."lambertX", NEW."lambertY"),26191),4326))
      INTO NEW.latitude, NEW.longitude;
  ELSE
    NEW.latitude := NULL;
    NEW.longitude := NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_zone_latlon ON zones;
CREATE TRIGGER trg_zone_latlon
  BEFORE INSERT OR UPDATE OF "lambertX", "lambertY" ON zones
  FOR EACH ROW EXECUTE FUNCTION update_zone_latlon();

DROP TRIGGER IF EXISTS trg_parcel_latlon ON parcels;
CREATE TRIGGER trg_parcel_latlon
  BEFORE INSERT OR UPDATE OF "lambertX", "lambertY" ON parcels
  FOR EACH ROW EXECUTE FUNCTION update_parcel_latlon();

-- When polygon vertices change, recompute centroid-based latitude/longitude
CREATE OR REPLACE FUNCTION refresh_zone_centroid(zid TEXT) RETURNS VOID AS $$
DECLARE
  pt geometry;
BEGIN
  SELECT ST_Centroid(ST_Collect(ST_SetSRID(ST_MakePoint("lambertX","lambertY"),26191)))
    INTO pt FROM zone_vertices WHERE "zoneId" = zid;
  IF pt IS NOT NULL THEN
    UPDATE zones
      SET latitude  = ST_Y(ST_Transform(pt,4326)),
          longitude = ST_X(ST_Transform(pt,4326))
    WHERE id = zid;
  END IF;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION zone_vertex_changed() RETURNS TRIGGER AS $$
BEGIN
  PERFORM refresh_zone_centroid(COALESCE(NEW."zoneId", OLD."zoneId"));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_zone_vert ON zone_vertices;
CREATE TRIGGER trg_zone_vert
  AFTER INSERT OR UPDATE OR DELETE ON zone_vertices
  FOR EACH ROW EXECUTE FUNCTION zone_vertex_changed();

CREATE OR REPLACE FUNCTION refresh_parcel_centroid(pid TEXT) RETURNS VOID AS $$
DECLARE
  pt geometry;
BEGIN
  SELECT ST_Centroid(ST_Collect(ST_SetSRID(ST_MakePoint("lambertX","lambertY"),26191)))
    INTO pt FROM parcel_vertices WHERE "parcelId" = pid;
  IF pt IS NOT NULL THEN
    UPDATE parcels
      SET latitude  = ST_Y(ST_Transform(pt,4326)),
          longitude = ST_X(ST_Transform(pt,4326))
    WHERE id = pid;
  END IF;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION parcel_vertex_changed() RETURNS TRIGGER AS $$
BEGIN
  PERFORM refresh_parcel_centroid(COALESCE(NEW."parcelId", OLD."parcelId"));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_parcel_vert ON parcel_vertices;
CREATE TRIGGER trg_parcel_vert
  AFTER INSERT OR UPDATE OR DELETE ON parcel_vertices
  FOR EACH ROW EXECUTE FUNCTION parcel_vertex_changed();

-- Clean tables in order
DO $$
DECLARE
  tables text[] := ARRAY[
    'zone_vertices', 'parcel_vertices',
    'zone_activities', 'parcel_amenities', 'appointments', 'parcels',
    'zones', 'zone_types', 'activities', 'amenities',
    'regions', 'countries', 'activity_logs', 'users'
  ];
  tbl text;
BEGIN
  RAISE NOTICE 'Starting data population...';
  FOREACH tbl IN ARRAY tables LOOP
    IF to_regclass('public.' || tbl) IS NOT NULL THEN
      EXECUTE format('TRUNCATE TABLE public.%I RESTART IDENTITY CASCADE', tbl);
      RAISE NOTICE 'Cleaned table: %', tbl;
    END IF;
  END LOOP;
END $$;

-- Demo users
INSERT INTO users (
  id, email, password, name, company, phone, role,
  "createdAt", "updatedAt"
) VALUES
  ('user-admin',   'admin@zonespro.ma',   '$2b$10$VQl88VBIZ6aR46F7Ju2sgO0LH8oTFbm0Mb8ayY1KeuU261EfwEnZS', 'Administrateur ZonesPro', 'ZonesPro Management', '+212 5 37 57 20 00', 'ADMIN',   NOW(), NOW()),
  ('user-manager', 'manager@zonespro.ma', '$2b$10$VQl88VBIZ6aR46F7Ju2sgO0LH8oTFbm0Mb8ayY1KeuU261EfwEnZS', 'Manager Commercial',       'ZonesPro Management', '+212 5 37 57 20 01', 'MANAGER', NOW(), NOW()),
  ('user-demo',    'demo@entreprise.ma',  '$2b$10$VQl88VBIZ6aR46F7Ju2sgO0LH8oTFbm0Mb8ayY1KeuU261EfwEnZS', 'Utilisateur Démo',         'Entreprise Démo SA',   '+212 6 12 34 56 78', 'USER',    NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Country and regions
INSERT INTO countries (id, name, code, "createdAt", "updatedAt") VALUES
  ('country-ma', 'Maroc', 'MA', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

INSERT INTO regions (id, name, code, "countryId", "createdAt", "updatedAt") VALUES
  ('region-cas', 'Casablanca-Settat', 'CAS', 'country-ma', NOW(), NOW()),
  ('region-rab', 'Rabat-Salé-Kénitra', 'RAB', 'country-ma', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Zone types
INSERT INTO zone_types (id, name) VALUES
  ('zt-private', 'privée'),
  ('zt-public',  'public')
ON CONFLICT (id) DO NOTHING;

-- Activities
INSERT INTO activities (id, name, description, icon, "createdAt", "updatedAt") VALUES
  ('act-auto', 'Automobile', 'Industrie automobile', 'car', NOW(), NOW()),
  ('act-log',  'Logistique', 'Stockage et distribution', 'package', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Amenities
INSERT INTO amenities (id, name, description, icon, category, "createdAt", "updatedAt") VALUES
  ('amn-electricity', 'Électricité', 'Alimentation électrique', 'zap', 'Infrastructure', NOW(), NOW()),
  ('amn-water',       'Eau potable', 'Réseau d''eau',             'droplet', 'Infrastructure', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Demo zone
INSERT INTO zones (
  id, name, description, address, "totalArea", price, status,
  "lambertX", "lambertY",
  "zoneTypeId", "regionId", "createdAt", "updatedAt"
) VALUES (
  'zone-demo',
  'Zone Industrielle Demo',
  'Zone de démonstration',
  'Route Demo',
  150000,
  2500,
  'AVAILABLE',
  423456.78,
  372890.12,
  'zt-private',
  'region-cas',
  NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

-- Parcels for the demo zone
INSERT INTO parcels (
  id, reference, area, price, status,
  "isFree", "isShowroom", cos, cus,
  "lambertX", "lambertY",
  "zoneId", "createdAt", "updatedAt"
) VALUES
  ('parcel-1', 'CAS-001', 10000, 2500, 'AVAILABLE', true, false, NULL, NULL, 423457, 372891, 'zone-demo', NOW(), NOW()),
  ('parcel-2', 'CAS-002', 12000, 2500, 'RESERVED', true, false, NULL, NULL, 423458, 372892, 'zone-demo', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Lambert polygon vertices for the demo zone
INSERT INTO zone_vertices ("zoneId", seq, "lambertX", "lambertY") VALUES
  ('zone-demo', 1, 423400, 372800),
  ('zone-demo', 2, 423600, 372800),
  ('zone-demo', 3, 423600, 373000),
  ('zone-demo', 4, 423400, 373000)
ON CONFLICT DO NOTHING;

INSERT INTO parcel_vertices ("parcelId", seq, "lambertX", "lambertY") VALUES
  ('parcel-1', 1, 423450, 372880),
  ('parcel-1', 2, 423480, 372880),
  ('parcel-1', 3, 423480, 372910),
  ('parcel-1', 4, 423450, 372910),
  ('parcel-2', 1, 423500, 372890),
  ('parcel-2', 2, 423530, 372890),
  ('parcel-2', 3, 423530, 372920),
  ('parcel-2', 4, 423500, 372920)
ON CONFLICT DO NOTHING;

-- Link activities and amenities to the zone
INSERT INTO zone_activities (id, "zoneId", "activityId") VALUES
  ('za-1', 'zone-demo', 'act-auto'),
  ('za-2', 'zone-demo', 'act-log')
ON CONFLICT (id) DO NOTHING;

INSERT INTO zone_amenities (id, "zoneId", "amenityId") VALUES
  ('zam-1', 'zone-demo', 'amn-electricity'),
  ('zam-2', 'zone-demo', 'amn-water')
ON CONFLICT (id) DO NOTHING;

-- Additional demo zones generated from Lambert polygons
-- Zone PIAJ
INSERT INTO zones (
  id, name, description, "totalArea", price, status,
  "lambertX", "lambertY",
  "zoneTypeId", "regionId", "createdAt", "updatedAt"
) VALUES (
  'zone-piaj', 'PIAJ', 'Zone générée automatiquement pour les tests',
  1201325.73, 0, 'AVAILABLE',
  409631.94, 368109.73,
  'zt-private', 'region-rab', NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

INSERT INTO zone_vertices ("zoneId", seq, "lambertX", "lambertY") VALUES
  ('zone-piaj', 1, 409201.18, 369451.53),
  ('zone-piaj', 2, 409639.39, 368996.57),
  ('zone-piaj', 3, 409763.12, 368701.53),
  ('zone-piaj', 4, 409854.56, 368701.5),
  ('zone-piaj', 5, 409874.98, 368535.76),
  ('zone-piaj', 6, 409901.57, 368332.92),
  ('zone-piaj', 7, 409954.02, 368056.56),
  ('zone-piaj', 8, 409957.84, 368038.85),
  ('zone-piaj', 9, 410025.04, 367870.11),
  ('zone-piaj', 10, 410201.81, 367573.04),
  ('zone-piaj', 11, 410291.56, 367448.47),
  ('zone-piaj', 12, 410374.16, 367349.62),
  ('zone-piaj', 13, 410511.24, 367195.09),
  ('zone-piaj', 14, 410533.95, 367167.98),
  ('zone-piaj', 15, 409747.77, 367450.59),
  ('zone-piaj', 16, 409177.19, 367596.6),
  ('zone-piaj', 17, 409169.8, 367713.76),
  ('zone-piaj', 18, 409079.41, 367761.79),
  ('zone-piaj', 19, 409093.04, 367817.5),
  ('zone-piaj', 20, 409207.3, 368014.74),
  ('zone-piaj', 21, 409272.68, 368149.4),
  ('zone-piaj', 22, 409154.81, 368156.65),
  ('zone-piaj', 23, 409177.97, 368416.89),
  ('zone-piaj', 24, 409297.11, 368471.41),
  ('zone-piaj', 25, 409302.81, 368473.53),
  ('zone-piaj', 26, 409295.06, 368673.32),
  ('zone-piaj', 27, 409240.68, 368810.94),
  ('zone-piaj', 28, 409439.13, 368804.35),
  ('zone-piaj', 29, 409201.18, 369451.53)
ON CONFLICT DO NOTHING;

-- Zone ZAINA
INSERT INTO zones (
  id, name, description, "totalArea", price, status,
  "lambertX", "lambertY",
  "zoneTypeId", "regionId", "createdAt", "updatedAt"
) VALUES (
  'zone-zaina', 'ZAINA', 'Zone générée automatiquement pour les tests',
  159338.90, 0, 'AVAILABLE',
  356319.60, 362468.27,
  'zt-private', 'region-rab', NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

INSERT INTO zone_vertices ("zoneId", seq, "lambertX", "lambertY") VALUES
  ('zone-zaina', 1, 356080.37, 362485.7),
  ('zone-zaina', 2, 356300.3, 362622.77),
  ('zone-zaina', 3, 356362.67, 362678.46),
  ('zone-zaina', 4, 356382.85, 362654.5),
  ('zone-zaina', 5, 356488.42, 362741.75),
  ('zone-zaina', 6, 356414.57, 362826.04),
  ('zone-zaina', 7, 356652.88, 362572.56),
  ('zone-zaina', 8, 356402.7, 362384.79),
  ('zone-zaina', 9, 356205.35, 362159.02),
  ('zone-zaina', 10, 356069.83, 362316.55),
  ('zone-zaina', 11, 356056.8, 362334.26),
  ('zone-zaina', 12, 356051.06, 362334.96),
  ('zone-zaina', 13, 355943.48, 362290.95),
  ('zone-zaina', 14, 355924.29, 362492.89),
  ('zone-zaina', 15, 355931.72, 362495.13),
  ('zone-zaina', 16, 355940.2, 362390.88),
  ('zone-zaina', 17, 355947.7, 362297.1),
  ('zone-zaina', 18, 356063.49, 362345.51),
  ('zone-zaina', 19, 356074.42, 362421.96),
  ('zone-zaina', 20, 356082.49, 362454.89),
  ('zone-zaina', 21, 356080.37, 362485.7)
ON CONFLICT DO NOTHING;

-- Zone OTTAWA
INSERT INTO zones (
  id, name, description, "totalArea", price, status,
  "lambertX", "lambertY",
  "zoneTypeId", "regionId", "createdAt", "updatedAt"
) VALUES (
  'zone-ottawa', 'OTTAWA', 'Zone générée automatiquement pour les tests',
  181100.01, 0, 'AVAILABLE',
  352117.78, 363220.00,
  'zt-private', 'region-rab', NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

INSERT INTO zone_vertices ("zoneId", seq, "lambertX", "lambertY") VALUES
  ('zone-ottawa', 1, 351900.19, 363533.59),
  ('zone-ottawa', 2, 351989.68, 363531.3),
  ('zone-ottawa', 3, 351988.73, 363461.25),
  ('zone-ottawa', 4, 352188.64, 363456.87),
  ('zone-ottawa', 5, 352187.55, 363381.01),
  ('zone-ottawa', 6, 352384.73, 363378.29),
  ('zone-ottawa', 7, 352381.99, 363232.45),
  ('zone-ottawa', 8, 352287.38, 363208.55),
  ('zone-ottawa', 9, 352241.53, 363105.9),
  ('zone-ottawa', 10, 352244.52, 363034.29),
  ('zone-ottawa', 11, 352303.18, 362994.99),
  ('zone-ottawa', 12, 352241.33, 362969.6),
  ('zone-ottawa', 13, 352074.35, 362901.55),
  ('zone-ottawa', 14, 351963.88, 362855.44),
  ('zone-ottawa', 15, 351980.16, 362887.19),
  ('zone-ottawa', 16, 352030.09, 363036.02),
  ('zone-ottawa', 17, 352045.39, 363088.39),
  ('zone-ottawa', 18, 351909.06, 363178.15),
  ('zone-ottawa', 19, 351931.83, 363461.12),
  ('zone-ottawa', 20, 351900.19, 363533.59)
ON CONFLICT DO NOTHING;

-- Simple appointment example
INSERT INTO appointments (
  id, "contactName", "contactEmail", "contactPhone", "companyName", message,
  "requestedDate", status, "parcelId", "userId", "createdAt", "updatedAt"
) VALUES (
  'appt-1',
  'Ahmed Benali', 'a.benali@entreprise.ma', '+212 6 12 34 56 78',
  'Industries Benali', 'Intéressé par une parcelle',
  '2024-02-15T10:00:00Z', 'PENDING', 'parcel-1', 'user-demo', NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

DO $$ BEGIN
  RAISE NOTICE '✅ Database initialization completed successfully!';
END $$;

