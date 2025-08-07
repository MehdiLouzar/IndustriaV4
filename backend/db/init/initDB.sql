-- initDB.sql - Données d'exemple pour la plateforme Industria
-- Version optimisée pour model-first avec Hibernate
-- Mise à jour : coordonnées géographiques réelles du Maroc

-- Activer les extensions nécessaires (si pas déjà fait par Hibernate)
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Users (avec gestion des conflits)
INSERT INTO users (
    id, email, password, name, company, phone, role,
    created_at, updated_at, deleted_at
)
SELECT * FROM (VALUES
    ('user-admin', 'admin@industria.ma', '$2b$10$VQl88VBIZ6aR46F7Ju2sgO0LH8oTFbm0Mb8ayY1KeuU261EfwEnZS',
     'Administrateur Industria', 'Industria Management', '+212 5 37 57 20 00', 'ADMIN', NOW(), NOW(), NULL::timestamp without time zone),
    ('user-manager', 'manager@industria.ma', '$2b$10$VQl88VBIZ6aR46F7Ju2sgO0LH8oTFbm0Mb8ayY1KeuU261EfwEnZS',
     'Manager Commercial', 'Industria Management', '+212 5 37 57 20 01', 'ZONE_MANAGER', NOW(), NOW(), NULL::timestamp without time zone),
    ('user-demo', 'demo@entreprise.ma', '$2b$10$VQl88VBIZ6aR46F7Ju2sgO0LH8oTFbm0Mb8ayY1KeuU261EfwEnZS',
     'Utilisateur Démo', 'Entreprise Démo SA', '+212 6 12 34 56 78', 'USER', NOW(), NOW(), NULL::timestamp without time zone)
) AS data(id, email, password, name, company, phone, role, created_at, updated_at, deleted_at)
WHERE NOT EXISTS (SELECT 1 FROM users);

-- Spatial reference systems
INSERT INTO spatial_reference_system (
    id, name, srid, proj4text, description, created_at, updated_at, deleted_at
)
SELECT * FROM (VALUES 
    ('srs-4326', 'WGS 84', 4326, '+proj=longlat +datum=WGS84 +no_defs',
     'World Geodetic System 1984', NOW(), NOW(), NULL::timestamp without time zone),
    ('srs-26191', 'Lambert Conformal Conic Morocco', 26191, '+proj=lcc +lat_1=33.3 +lat_2=34.86666666666667 +lat_0=34.03333333333333 +lon_0=-3 +x_0=500000 +y_0=300000 +datum=clarke80 +units=m +no_defs',
     'Lambert Conformal Conic projection for Morocco', NOW(), NOW(), NULL::timestamp without time zone)
) AS data(id, name, srid, proj4text, description, created_at, updated_at, deleted_at)
WHERE NOT EXISTS (SELECT 1 FROM spatial_reference_system WHERE id = data.id);

-- Countries
INSERT INTO country (
    id, name, code, currency, default_srid, created_at, updated_at, deleted_at, srs_id
)
SELECT * FROM (VALUES (
    'country-ma', 'Maroc', 'MA', 'MAD', 26191, NOW(), NOW(), NULL::timestamp without time zone, 'srs-26191'
)) AS data(id, name, code, currency, default_srid, created_at, updated_at, deleted_at, srs_id)
WHERE NOT EXISTS (SELECT 1 FROM country);

-- Regions
INSERT INTO region (
    id, name, code, created_at, updated_at, deleted_at, country_id
)
SELECT * FROM (VALUES
    ('region-cas', 'Casablanca-Settat', 'CAS', NOW(), NOW(), NULL::timestamp without time zone, 'country-ma'),
    ('region-rab', 'Rabat-Salé-Kénitra', 'RAB', NOW(), NOW(), NULL::timestamp without time zone, 'country-ma'),
    ('region-mar', 'Marrakech-Safi', 'MAR', NOW(), NOW(), NULL::timestamp without time zone, 'country-ma'),
    ('region-tan', 'Tanger-Tétouan-Al Hoceima', 'TAN', NOW(), NOW(), NULL::timestamp without time zone, 'country-ma')
) AS data(id, name, code, created_at, updated_at, deleted_at, country_id)
WHERE NOT EXISTS (SELECT 1 FROM region);

-- Zone types
INSERT INTO zone_type (
    id, name, description, created_at, updated_at, deleted_at
)
SELECT * FROM (VALUES
    ('zt-private', 'Privée', 'Zone à gestion privée', NOW(), NOW(), NULL::timestamp without time zone),
    ('zt-public', 'Publique', 'Zone à gestion publique', NOW(), NOW(), NULL::timestamp without time zone),
    ('zt-free-zone', 'Zone Franche', 'Zone franche d''exportation', NOW(), NOW(), NULL::timestamp without time zone),
    ('zt-logistics', 'Parc Logistique', 'Zone spécialisée en logistique', NOW(), NOW(), NULL::timestamp without time zone)
) AS data(id, name, description, created_at, updated_at, deleted_at)
WHERE NOT EXISTS (SELECT 1 FROM zone_type);

-- Activities
INSERT INTO activity (
    id, name, description, icon, category, created_at, updated_at, deleted_at
)
SELECT * FROM (VALUES
    ('act-auto', 'Automobile', 'Industrie automobile', 'car', 'industrie', NOW(), NOW(), NULL::timestamp without time zone),
    ('act-log', 'Logistique', 'Stockage et distribution', 'package', 'industrie', NOW(), NOW(), NULL::timestamp without time zone),
    ('act-textile', 'Textile', 'Industrie textile', 'shirt', 'industrie', NOW(), NOW(), NULL::timestamp without time zone),
    ('act-pharma', 'Pharmaceutique', 'Industrie pharmaceutique', 'pill', 'industrie', NOW(), NOW(), NULL::timestamp without time zone)
) AS data(id, name, description, icon, category, created_at, updated_at, deleted_at)
WHERE NOT EXISTS (SELECT 1 FROM activity);

-- Amenities
INSERT INTO amenity (
    id, name, description, icon, category, created_at, updated_at, deleted_at
)
SELECT * FROM (VALUES
    ('amn-electricity', 'Électricité', 'Alimentation électrique', 'zap', 'Infrastructure', NOW(), NOW(), NULL::timestamp without time zone),
    ('amn-water', 'Eau potable', 'Réseau d''eau', 'droplet', 'Infrastructure', NOW(), NOW(), NULL::timestamp without time zone),
    ('amn-internet', 'Internet', 'Connexion haut débit', 'wifi', 'Infrastructure', NOW(), NOW(), NULL::timestamp without time zone),
    ('amn-security', 'Sécurité', 'Surveillance 24h/24', 'shield', 'Sécurité', NOW(), NOW(), NULL::timestamp without time zone),
    ('amn-parking', 'Parking', 'Espaces de stationnement', 'car', 'Services', NOW(), NOW(), NULL::timestamp without time zone)
) AS data(id, name, description, icon, category, created_at, updated_at, deleted_at)
WHERE NOT EXISTS (SELECT 1 FROM amenity);

-- 1) Zones avec coordonnées Lambert réelles du Maroc (EPSG:26191)
INSERT INTO zone (
    id, name, description, address, total_area, price, price_type,
    construction_type, status, geometry, srid, created_at, updated_at, deleted_at,
    zone_type_id, region_id, created_by
)
SELECT * FROM (VALUES
    -- Zone démo - Coordonnées Lambert précises
    ('zone-demo', 'Zone Industrielle Demo', 'Zone de démonstration avec infrastructures complètes', 'Route Demo, Casablanca',
     150000, 2500, 'PER_SQUARE_METER', 'CUSTOM_BUILD', 'LIBRE',
     ST_SetSRID(ST_GeomFromText('POLYGON((423400 372800, 423600 372800, 423600 373000, 423400 373000, 423400 372800))'), 26191),
     26191, NOW(), NOW(), NULL::timestamp without time zone,
     'zt-private', 'region-cas', 'user-admin'),

    -- Zone Casablanca Nord
    ('zone-casa-nord', 'Zone Industrielle Casablanca Nord', 'Zone industrielle moderne avec accès autoroutier', 'Route de Rabat, Ain Sebaä, Casablanca',
     200000, 3000, 'PER_SQUARE_METER', 'TURNKEY', 'LIBRE',
     ST_SetSRID(ST_GeomFromText('POLYGON((424000 373500, 424200 373500, 424200 373700, 424000 373700, 424000 373500))'), 26191),
     26191, NOW(), NOW(), NULL::timestamp without time zone,
     'zt-public', 'region-cas', 'user-admin'),

    -- Parc Industriel Aín Johra (PIAJ) - Coordonnées Lambert précises
    ('zone-piaj', 'PIAJ', 'Parc industriel moderne proche de Rabat-Salé', 'Aín Johra, Salé',
     1201325.73, 2200, 'PER_SQUARE_METER', 'TURNKEY', 'LIBRE',
     ST_SetSRID(ST_GeomFromText('POLYGON((409201.18 369451.53, 409639.39 368996.57, 409763.12 368701.53, 409854.56 368701.5, 409874.98 368535.76, 409901.57 368332.92, 409954.02 368056.56, 409957.84 368038.85, 410025.04 367870.11, 410201.81 367573.04, 410291.56 367448.47, 410374.16 367349.62, 410511.24 367195.09, 410533.95 367167.98, 409747.77 367450.59, 409177.19 367596.6, 409169.8 367713.76, 409079.41 367761.79, 409093.04 367817.5, 409207.3 368014.74, 409272.68 368149.4, 409154.81 368156.65, 409177.97 368416.89, 409297.11 368471.41, 409302.81 368473.53, 409295.06 368673.32, 409240.68 368810.94, 409439.13 368804.35, 409201.18 369451.53))'), 26191),
     26191, NOW(), NOW(), NULL::timestamp without time zone,
     'zt-public', 'region-rab', 'user-admin'),

    -- Zone Industrielle ZAINA - Coordonnées Lambert précises
    ('zone-zaina', 'ZAINA', 'Zone industrielle à Kénitra avec accès portuaire', 'Kénitra',
     159338.90, 1800, 'PER_SQUARE_METER', 'CUSTOM_BUILD', 'LIBRE',
     ST_SetSRID(ST_GeomFromText('POLYGON((356080.37 362485.7, 356300.3 362622.77, 356362.67 362678.46, 356382.85 362654.5, 356488.42 362741.75, 356414.57 362826.04, 356652.88 362572.56, 356402.7 362384.79, 356205.35 362159.02, 356069.83 362316.55, 356056.8 362334.26, 356051.06 362334.96, 355943.48 362290.95, 355924.29 362492.89, 355931.72 362495.13, 355940.2 362390.88, 355947.7 362297.1, 356063.49 362345.51, 356074.42 362421.96, 356082.49 362454.89, 356080.37 362485.7))'), 26191),
     26191, NOW(), NOW(), NULL::timestamp without time zone,
     'zt-free-zone', 'region-rab', 'user-admin'),

    -- Zone Logistique OTTAWA (ex-Haidara) - Coordonnées Lambert précises
    ('zone-ottawa', 'OTTAWA', 'Plateforme logistique moderne au Maroc', 'Zone industrielle Ottawa',
     181100.01, 2800, 'PER_SQUARE_METER', 'TURNKEY', 'LIBRE',
     ST_SetSRID(ST_GeomFromText('POLYGON((351900.19 363533.59, 351989.68 363531.3, 351988.73 363461.25, 352188.64 363456.87, 352187.55 363381.01, 352384.73 363378.29, 352381.99 363232.45, 352287.38 363208.55, 352241.53 363105.9, 352244.52 363034.29, 352303.18 362994.99, 352241.33 362969.6, 352074.35 362901.55, 351963.88 362855.44, 351980.16 362887.19, 352030.09 363036.02, 352045.39 363088.39, 351909.06 363178.15, 351931.83 363461.12, 351900.19 363533.59))'), 26191),
     26191, NOW(), NOW(), NULL::timestamp without time zone,
     'zt-logistics', 'region-rab', 'user-admin'),

    -- Zone additionnelle Marrakech
    ('zone-marrakech-1', 'Zone Industrielle Marrakech Sud', 'Zone industrielle avec avantages fiscaux', 'Route de l''Aéroport, Marrakech',
     95000, 2000, 'PER_SQUARE_METER', 'CUSTOM_BUILD', 'LIBRE',
     ST_SetSRID(ST_GeomFromText('POLYGON((280000 315000, 280200 315000, 280200 315200, 280000 315200, 280000 315000))'), 26191),
     26191, NOW(), NOW(), NULL::timestamp without time zone,
     'zt-private', 'region-mar', 'user-admin')
) AS data(
    id, name, description, address, total_area, price, price_type,
    construction_type, status, geometry, srid, created_at, updated_at, deleted_at,
    zone_type_id, region_id, created_by
)
WHERE NOT EXISTS (SELECT 1 FROM zone WHERE zone.id = data.id);



-- 2) Parcelles avec coordonnées Lambert précises
INSERT INTO parcel (
    id, reference, area, status, is_showroom, cos, cus, height_limit, setback,
    geometry, srid, created_at, updated_at, deleted_at, zone_id, created_by
)
SELECT * FROM (VALUES
    ('parcel-1', 'CAS-001', 10000, 'LIBRE', false, 0.6, 1.2, 15.0, 5.0,
     ST_SetSRID(
       ST_GeomFromText('POLYGON((423450 372880, 423480 372880, 423480 372910, 423450 372910, 423450 372880))'),
       26191
     ), 26191, NOW(), NOW(), NULL::timestamp without time zone, 'zone-demo', 'user-admin'),

    ('parcel-2', 'CAS-002', 12000, 'RESERVEE', false, 0.7, 1.4, 18.0, 4.0,
     ST_SetSRID(
       ST_GeomFromText('POLYGON((423500 372890, 423530 372890, 423530 372920, 423500 372920, 423500 372890))'),
       26191
     ), 26191, NOW(), NOW(), NULL::timestamp without time zone, 'zone-demo', 'user-admin'),

    ('parcel-3', 'CAS-NORD-001', 15000, 'LIBRE', false, 0.65, 1.3, 20.0, 6.0,
     ST_SetSRID(
       ST_GeomFromText('POLYGON((424050 373550, 424080 373550, 424080 373580, 424050 373580, 424050 373550))'),
       26191
     ), 26191, NOW(), NOW(), NULL::timestamp without time zone, 'zone-casa-nord', 'user-admin')
) AS data(
    id, reference, area, status, is_showroom, cos, cus, height_limit, setback,
    geometry, srid, created_at, updated_at, deleted_at, zone_id, created_by
)
WHERE NOT EXISTS (SELECT 1 FROM parcel WHERE parcel.id = data.id);



-- 3) Maintenant que les zones et parcels existent, tu peux lier activités/commodités sans FK errors :

INSERT INTO zone_activity (id, zone_id, activity_id)
SELECT * FROM (VALUES
    ('za-1', 'zone-demo', 'act-auto'),
    ('za-2', 'zone-demo', 'act-log'),
    ('za-3', 'zone-casa-nord', 'act-textile'),
    ('za-4', 'zone-casa-nord', 'act-pharma'),
    ('za-5', 'zone-piaj', 'act-auto'),
    ('za-6', 'zone-zaina', 'act-log'),
    ('za-7', 'zone-ottawa', 'act-log'),
    ('za-8', 'zone-marrakech-1', 'act-textile')
) AS d(id, zone_id, activity_id)
WHERE NOT EXISTS (SELECT 1 FROM zone_activity WHERE id = d.id);

INSERT INTO zone_amenity (id, zone_id, amenity_id)
SELECT * FROM (VALUES
    ('zam-1', 'zone-demo', 'amn-electricity'),
    ('zam-2', 'zone-demo', 'amn-water'),
    ('zam-3', 'zone-demo', 'amn-internet'),
    ('zam-4', 'zone-casa-nord', 'amn-electricity'),
    ('zam-5', 'zone-casa-nord', 'amn-water'),
    ('zam-6', 'zone-casa-nord', 'amn-security'),
    ('zam-7', 'zone-casa-nord', 'amn-parking'),
    ('zam-8', 'zone-piaj', 'amn-electricity'),
    ('zam-9', 'zone-piaj', 'amn-water'),
    ('zam-10', 'zone-piaj', 'amn-internet'),
    ('zam-11', 'zone-zaina', 'amn-electricity'),
    ('zam-12', 'zone-zaina', 'amn-water'),
    ('zam-13', 'zone-ottawa', 'amn-electricity'),
    ('zam-14', 'zone-ottawa', 'amn-water'),
    ('zam-15', 'zone-ottawa', 'amn-security'),
    ('zam-16', 'zone-marrakech-1', 'amn-electricity'),
    ('zam-17', 'zone-marrakech-1', 'amn-water')
) AS d(id, zone_id, amenity_id)
WHERE NOT EXISTS (SELECT 1 FROM zone_amenity WHERE id = d.id);


-- Message de fin
DO $$
BEGIN
    RAISE NOTICE '✅ Database initialization completed successfully!';
    RAISE NOTICE '📊 Sample data summary:';
    RAISE NOTICE '   - Users: % records', (SELECT count(*) FROM users);
    RAISE NOTICE '   - Zones: % records', (SELECT count(*) FROM zone);
    RAISE NOTICE '   - Parcels: % records', (SELECT count(*) FROM parcel);
    RAISE NOTICE '   - Activities: % records', (SELECT count(*) FROM activity);
    RAISE NOTICE '   - Amenities: % records', (SELECT count(*) FROM amenity);
    RAISE NOTICE '   - Appointments: % records', (SELECT count(*) FROM appointment);
END $$;
