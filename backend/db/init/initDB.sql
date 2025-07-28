-- db/init/initDB.sql
-- Sample data for Industria platform JPA model

CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Remove existing data in order
DO $$
DECLARE
  tbl text;
  tables text[] := ARRAY[
    'notification', 'notification_template', 'audit_log', 'appointment',
    'parcel_amenity', 'zone_amenity', 'zone_activity',
    'parcel', 'zone', 'amenity', 'activity', 'zone_type',
    'region', 'country', 'spatial_reference_system', 'user'
  ];
BEGIN
  FOREACH tbl IN ARRAY tables LOOP
    IF to_regclass('public.' || tbl) IS NOT NULL THEN
      EXECUTE format('TRUNCATE TABLE public.%I RESTART IDENTITY CASCADE', tbl);
    END IF;
  END LOOP;
END $$;

-- Users
INSERT INTO "user" (
  id, email, password, name, company, phone, role,
  created_at, updated_at
) VALUES
  ('user-admin', 'admin@zonespro.ma', '$2b$10$VQl88VBIZ6aR46F7Ju2sgO0LH8oTFbm0Mb8ayY1KeuU261EfwEnZS',
   'Administrateur ZonesPro', 'ZonesPro Management', '+212 5 37 57 20 00', 'ADMIN', NOW(), NOW()),
  ('user-manager', 'manager@zonespro.ma', '$2b$10$VQl88VBIZ6aR46F7Ju2sgO0LH8oTFbm0Mb8ayY1KeuU261EfwEnZS',
   'Manager Commercial', 'ZonesPro Management', '+212 5 37 57 20 01', 'ZONE_MANAGER', NOW(), NOW()),
  ('user-demo', 'demo@entreprise.ma', '$2b$10$VQl88VBIZ6aR46F7Ju2sgO0LH8oTFbm0Mb8ayY1KeuU261EfwEnZS',
   'Utilisateur Démo', 'Entreprise Démo SA', '+212 6 12 34 56 78', 'USER', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Spatial reference system
INSERT INTO spatial_reference_system (
  id, name, srid, proj4text, description, created_at, updated_at
) VALUES (
  'srs-4326', 'WGS 84', 4326, '+proj=longlat +datum=WGS84 +no_defs',
  'Default geodetic system', NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

-- Countries
INSERT INTO country (
  id, name, code, currency, default_srid, created_at, updated_at, srs_id
) VALUES (
  'country-ma', 'Maroc', 'MA', 'MAD', 4326, NOW(), NOW(), 'srs-4326'
) ON CONFLICT (id) DO NOTHING;

-- Regions
INSERT INTO region (
  id, name, code, created_at, updated_at, country_id
) VALUES
  ('region-cas', 'Casablanca-Settat', 'CAS', NOW(), NOW(), 'country-ma'),
  ('region-rab', 'Rabat-Salé-Kénitra', 'RAB', NOW(), NOW(), 'country-ma')
ON CONFLICT (id) DO NOTHING;

-- Zone types
INSERT INTO zone_type (
  id, name, description, created_at, updated_at
) VALUES
  ('zt-private', 'Privée', 'Zone à gestion privée', NOW(), NOW()),
  ('zt-public', 'Publique', 'Zone à gestion publique', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Activities
INSERT INTO activity (
  id, name, description, icon, category, created_at, updated_at
) VALUES
  ('act-auto', 'Automobile', 'Industrie automobile', 'car', 'industrie', NOW(), NOW()),
  ('act-log', 'Logistique', 'Stockage et distribution', 'package', 'industrie', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Amenities
INSERT INTO amenity (
  id, name, description, icon, category, created_at, updated_at
) VALUES
  ('amn-electricity', 'Électricité', 'Alimentation électrique', 'zap', 'Infrastructure', NOW(), NOW()),
  ('amn-water', 'Eau potable', 'Réseau d''eau', 'droplet', 'Infrastructure', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Zone
INSERT INTO zone (
  id, name, description, address, total_area, price, price_type,
  construction_type, status, geometry, srid, created_at, updated_at,
  zone_type_id, region_id, created_by
) VALUES (
  'zone-demo', 'Zone Industrielle Demo', 'Zone de démonstration', 'Route Demo',
  150000, 2500, 'PER_SQUARE_METER', 'CUSTOM_BUILD', 'LIBRE',
  'POLYGON((0 0,1 0,1 1,0 1,0 0))', 4326, NOW(), NOW(),
  'zt-private', 'region-cas', 'user-admin'
) ON CONFLICT (id) DO NOTHING;

-- Parcels
INSERT INTO parcel (
  id, reference, area, status, is_showroom, cos, cus, height_limit, setback,
  geometry, srid, created_at, updated_at, zone_id, created_by
) VALUES
  ('parcel-1', 'CAS-001', 10000, 'LIBRE', false, NULL, NULL, NULL, NULL,
   'POLYGON((0 0,0.5 0,0.5 0.5,0 0.5,0 0))', 4326, NOW(), NOW(), 'zone-demo', 'user-admin'),
  ('parcel-2', 'CAS-002', 12000, 'RESERVEE', false, NULL, NULL, NULL, NULL,
   'POLYGON((0.5 0,1 0,1 0.5,0.5 0.5,0.5 0))', 4326, NOW(), NOW(), 'zone-demo', 'user-admin')
ON CONFLICT (id) DO NOTHING;

-- Zone activities
INSERT INTO zone_activity (id, zone_id, activity_id) VALUES
  ('za-1', 'zone-demo', 'act-auto'),
  ('za-2', 'zone-demo', 'act-log')
ON CONFLICT (id) DO NOTHING;

-- Zone amenities
INSERT INTO zone_amenity (id, zone_id, amenity_id) VALUES
  ('zam-1', 'zone-demo', 'amn-electricity'),
  ('zam-2', 'zone-demo', 'amn-water')
ON CONFLICT (id) DO NOTHING;

-- Parcel amenities
INSERT INTO parcel_amenity (id, parcel_id, amenity_id) VALUES
  ('pa-1', 'parcel-1', 'amn-electricity')
ON CONFLICT (id) DO NOTHING;

-- Appointment
INSERT INTO appointment (
  id, contact_name, contact_email, contact_phone, company_name, message,
  requested_date, confirmed_date, status, notes,
  created_at, updated_at, parcel_id, managed_by
) VALUES (
  'appt-1', 'Ahmed Benali', 'a.benali@entreprise.ma', '+212 6 12 34 56 78',
  'Industries Benali', 'Intéressé par une parcelle',
  '2024-02-15T10:00:00Z', NULL, 'PENDING', NULL,
  NOW(), NOW(), 'parcel-1', 'user-manager'
) ON CONFLICT (id) DO NOTHING;

DO $$ BEGIN
  RAISE NOTICE 'Database initialization completed';
END $$;
