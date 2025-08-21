-- initDB.sql - Données d'exemple pour la plateforme Industria
-- Version optimisée pour model-first avec Hibernate
-- Mise à jour : coordonnées géographiques réelles du Maroc
-- Amélioration : Calcul automatique de latitude/longitude depuis les coordonnées Lambert
-- Les colonnes latitude et longitude sont calculées automatiquement via ST_Transform 
-- pour simplifier les futures migrations depuis des données Lambert

-- Activer les extensions nécessaires (si pas déjà fait par Hibernate)
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Users de base pour les données de test (seront synchronisés avec Keycloak lors de la première connexion)
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
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = data.email);

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

-- Spatial reference systems supplémentaires
INSERT INTO spatial_reference_system (
    id, name, srid, proj4text, description, created_at, updated_at, deleted_at
)
SELECT * FROM (VALUES 
    ('srs-2154', 'RGF93 / Lambert-93', 2154, '+proj=lcc +lat_1=49 +lat_2=44 +lat_0=46.5 +lon_0=3 +x_0=700000 +y_0=6600000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs',
     'Lambert Conformal Conic projection for France', NOW(), NOW(), NULL::timestamp without time zone),
    ('srs-31370', 'Belge 1972 / Belgian Lambert 72', 31370, '+proj=lcc +lat_1=51.16666723333333 +lat_2=49.8333339 +lat_0=90 +lon_0=4.367486666666666 +x_0=150000.013 +y_0=5400088.438 +ellps=intl +towgs84=-106.869,52.2978,-103.724,0.3366,-0.457,1.8422,-1.2747 +units=m +no_defs',
     'Lambert Conformal Conic projection for Belgium', NOW(), NOW(), NULL::timestamp without time zone)
) AS data(id, name, srid, proj4text, description, created_at, updated_at, deleted_at)
WHERE NOT EXISTS (SELECT 1 FROM spatial_reference_system WHERE id = data.id);

-- Countries
INSERT INTO country (
    id, name, code, currency, default_srid, created_at, updated_at, deleted_at, srs_id
)
SELECT * FROM (VALUES 
    ('country-ma', 'Maroc', 'MA', 'MAD', 26191, NOW(), NOW(), NULL::timestamp without time zone, 'srs-26191'),
    ('country-fr', 'France', 'FR', 'EUR', 2154, NOW(), NOW(), NULL::timestamp without time zone, 'srs-2154')
) AS data(id, name, code, currency, default_srid, created_at, updated_at, deleted_at, srs_id)
WHERE NOT EXISTS (SELECT 1 FROM country WHERE id = data.id);

-- Regions du Maroc
INSERT INTO region (
    id, name, code, created_at, updated_at, deleted_at, country_id
)
SELECT * FROM (VALUES
    -- Maroc
    ('region-cas', 'Casablanca-Settat', 'CAS', NOW(), NOW(), NULL::timestamp without time zone, 'country-ma'),
    ('region-rab', 'Rabat-Salé-Kénitra', 'RAB', NOW(), NOW(), NULL::timestamp without time zone, 'country-ma'),
    ('region-mar', 'Marrakech-Safi', 'MAR', NOW(), NOW(), NULL::timestamp without time zone, 'country-ma'),
    ('region-tan', 'Tanger-Tétouan-Al Hoceima', 'TAN', NOW(), NOW(), NULL::timestamp without time zone, 'country-ma'),
    ('region-fes', 'Fès-Meknès', 'FES', NOW(), NOW(), NULL::timestamp without time zone, 'country-ma'),
    ('region-ori', 'L''Oriental', 'ORI', NOW(), NOW(), NULL::timestamp without time zone, 'country-ma'),
    ('region-ben', 'Béni Mellal-Khénifra', 'BEN', NOW(), NOW(), NULL::timestamp without time zone, 'country-ma'),
    ('region-dar', 'Dakhla-Oued Ed-Dahab', 'DAR', NOW(), NOW(), NULL::timestamp without time zone, 'country-ma'),
    ('region-laa', 'Laâyoune-Sakia El Hamra', 'LAA', NOW(), NOW(), NULL::timestamp without time zone, 'country-ma'),
    ('region-gue', 'Guelmim-Oued Noun', 'GUE', NOW(), NOW(), NULL::timestamp without time zone, 'country-ma'),
    ('region-sou', 'Souss-Massa', 'SOU', NOW(), NOW(), NULL::timestamp without time zone, 'country-ma'),
    ('region-dra', 'Drâa-Tafilalet', 'DRA', NOW(), NOW(), NULL::timestamp without time zone, 'country-ma'),
    -- France
    ('region-idf', 'Île-de-France', 'IDF', NOW(), NOW(), NULL::timestamp without time zone, 'country-fr'),
    ('region-ara-lyon', 'Auvergne-Rhône-Alpes', 'ARA', NOW(), NOW(), NULL::timestamp without time zone, 'country-fr'),
    ('region-hdf', 'Hauts-de-France', 'HDF', NOW(), NOW(), NULL::timestamp without time zone, 'country-fr'),
    ('region-paca', 'Provence-Alpes-Côte d''Azur', 'PACA', NOW(), NOW(), NULL::timestamp without time zone, 'country-fr'),
    ('region-occ', 'Occitanie', 'OCC', NOW(), NOW(), NULL::timestamp without time zone, 'country-fr'),
    ('region-naq', 'Nouvelle-Aquitaine', 'NAQ', NOW(), NOW(), NULL::timestamp without time zone, 'country-fr'),
    ('region-pdl', 'Pays de la Loire', 'PDL', NOW(), NOW(), NULL::timestamp without time zone, 'country-fr'),
    ('region-bre', 'Bretagne', 'BRE', NOW(), NOW(), NULL::timestamp without time zone, 'country-fr'),
    ('region-cvl', 'Centre-Val de Loire', 'CVL', NOW(), NOW(), NULL::timestamp without time zone, 'country-fr'),
    ('region-nor', 'Normandie', 'NOR', NOW(), NOW(), NULL::timestamp without time zone, 'country-fr'),
    ('region-bfc', 'Bourgogne-Franche-Comté', 'BFC', NOW(), NOW(), NULL::timestamp without time zone, 'country-fr'),
    ('region-ges', 'Grand Est', 'GES', NOW(), NOW(), NULL::timestamp without time zone, 'country-fr'),
    ('region-cor', 'Corse', 'COR', NOW(), NOW(), NULL::timestamp without time zone, 'country-fr')
) AS data(id, name, code, created_at, updated_at, deleted_at, country_id)
WHERE NOT EXISTS (SELECT 1 FROM region WHERE id = data.id);

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
-- Calcul automatique de latitude/longitude depuis les coordonnées Lambert
INSERT INTO zone (
    id, name, description, address, total_area, price, price_type,
    construction_type, status, geometry, srid, latitude, longitude,
    created_at, updated_at, deleted_at, zone_type_id, region_id, created_by
)

-- Zone démo - Coordonnées Lambert précises
SELECT 
    'zone-demo', 'Zone Industrielle Demo', 'Zone de démonstration avec infrastructures complètes', 'Route Demo, Casablanca',
    150000, 2500, 'PER_SQUARE_METER', 'CUSTOM_BUILD', 'LIBRE',
    ST_SetSRID(ST_GeomFromText('POLYGON((423400 372800, 423600 372800, 423600 373000, 423400 373000, 423400 372800))'), 26191) as geom,
    26191,
    ST_Y(ST_Transform(ST_Centroid(ST_SetSRID(ST_GeomFromText('POLYGON((423400 372800, 423600 372800, 423600 373000, 423400 373000, 423400 372800))'), 26191)), 4326)) as latitude,
    ST_X(ST_Transform(ST_Centroid(ST_SetSRID(ST_GeomFromText('POLYGON((423400 372800, 423600 372800, 423600 373000, 423400 373000, 423400 372800))'), 26191)), 4326)) as longitude,
    NOW(), NOW(), NULL::timestamp without time zone,
    'zt-private', 'region-cas', 'admin@industria.ma'
WHERE NOT EXISTS (SELECT 1 FROM zone WHERE id = 'zone-demo')

UNION ALL

-- Zone Casablanca Nord
SELECT 
    'zone-casa-nord', 'Zone Industrielle Casablanca Nord', 'Zone industrielle moderne avec accès autoroutier', 'Route de Rabat, Ain Sebaä, Casablanca',
    200000, 3000, 'PER_SQUARE_METER', 'TURNKEY', 'LIBRE',
    ST_SetSRID(ST_GeomFromText('POLYGON((424000 373500, 424200 373500, 424200 373700, 424000 373700, 424000 373500))'), 26191),
    26191,
    ST_Y(ST_Transform(ST_Centroid(ST_SetSRID(ST_GeomFromText('POLYGON((424000 373500, 424200 373500, 424200 373700, 424000 373700, 424000 373500))'), 26191)), 4326)),
    ST_X(ST_Transform(ST_Centroid(ST_SetSRID(ST_GeomFromText('POLYGON((424000 373500, 424200 373500, 424200 373700, 424000 373700, 424000 373500))'), 26191)), 4326)),
    NOW(), NOW(), NULL::timestamp without time zone,
    'zt-public', 'region-cas', 'admin@industria.ma'
WHERE NOT EXISTS (SELECT 1 FROM zone WHERE id = 'zone-casa-nord')

UNION ALL

-- Parc Industriel Aín Johra (PIAJ) - Coordonnées Lambert précises
SELECT 
    'zone-piaj', 'PIAJ', 'Parc industriel moderne proche de Rabat-Salé', 'Aín Johra, Salé',
    1201325.73, 2200, 'PER_SQUARE_METER', 'TURNKEY', 'LIBRE',
    ST_SetSRID(ST_GeomFromText('POLYGON((409201.18 369451.53, 409639.39 368996.57, 409763.12 368701.53, 409854.56 368701.5, 409874.98 368535.76, 409901.57 368332.92, 409954.02 368056.56, 409957.84 368038.85, 410025.04 367870.11, 410201.81 367573.04, 410291.56 367448.47, 410374.16 367349.62, 410511.24 367195.09, 410533.95 367167.98, 409747.77 367450.59, 409177.19 367596.6, 409169.8 367713.76, 409079.41 367761.79, 409093.04 367817.5, 409207.3 368014.74, 409272.68 368149.4, 409154.81 368156.65, 409177.97 368416.89, 409297.11 368471.41, 409302.81 368473.53, 409295.06 368673.32, 409240.68 368810.94, 409439.13 368804.35, 409201.18 369451.53))'), 26191),
    26191,
    ST_Y(ST_Transform(ST_Centroid(ST_SetSRID(ST_GeomFromText('POLYGON((409201.18 369451.53, 409639.39 368996.57, 409763.12 368701.53, 409854.56 368701.5, 409874.98 368535.76, 409901.57 368332.92, 409954.02 368056.56, 409957.84 368038.85, 410025.04 367870.11, 410201.81 367573.04, 410291.56 367448.47, 410374.16 367349.62, 410511.24 367195.09, 410533.95 367167.98, 409747.77 367450.59, 409177.19 367596.6, 409169.8 367713.76, 409079.41 367761.79, 409093.04 367817.5, 409207.3 368014.74, 409272.68 368149.4, 409154.81 368156.65, 409177.97 368416.89, 409297.11 368471.41, 409302.81 368473.53, 409295.06 368673.32, 409240.68 368810.94, 409439.13 368804.35, 409201.18 369451.53))'), 26191)), 4326)),
    ST_X(ST_Transform(ST_Centroid(ST_SetSRID(ST_GeomFromText('POLYGON((409201.18 369451.53, 409639.39 368996.57, 409763.12 368701.53, 409854.56 368701.5, 409874.98 368535.76, 409901.57 368332.92, 409954.02 368056.56, 409957.84 368038.85, 410025.04 367870.11, 410201.81 367573.04, 410291.56 367448.47, 410374.16 367349.62, 410511.24 367195.09, 410533.95 367167.98, 409747.77 367450.59, 409177.19 367596.6, 409169.8 367713.76, 409079.41 367761.79, 409093.04 367817.5, 409207.3 368014.74, 409272.68 368149.4, 409154.81 368156.65, 409177.97 368416.89, 409297.11 368471.41, 409302.81 368473.53, 409295.06 368673.32, 409240.68 368810.94, 409439.13 368804.35, 409201.18 369451.53))'), 26191)), 4326)),
    NOW(), NOW(), NULL::timestamp without time zone,
    'zt-public', 'region-rab', 'admin@industria.ma'
WHERE NOT EXISTS (SELECT 1 FROM zone WHERE id = 'zone-piaj')

UNION ALL

-- Zone Industrielle ZAINA - Coordonnées Lambert précises
SELECT 
    'zone-zaina', 'ZAINA', 'Zone industrielle à Kénitra avec accès portuaire', 'Kénitra',
    159338.90, 1800, 'PER_SQUARE_METER', 'CUSTOM_BUILD', 'LIBRE',
    ST_SetSRID(ST_GeomFromText('POLYGON((356080.37 362485.7, 356300.3 362622.77, 356362.67 362678.46, 356382.85 362654.5, 356488.42 362741.75, 356414.57 362826.04, 356652.88 362572.56, 356402.7 362384.79, 356205.35 362159.02, 356069.83 362316.55, 356056.8 362334.26, 356051.06 362334.96, 355943.48 362290.95, 355924.29 362492.89, 355931.72 362495.13, 355940.2 362390.88, 355947.7 362297.1, 356063.49 362345.51, 356074.42 362421.96, 356082.49 362454.89, 356080.37 362485.7))'), 26191),
    26191,
    ST_Y(ST_Transform(ST_Centroid(ST_SetSRID(ST_GeomFromText('POLYGON((356080.37 362485.7, 356300.3 362622.77, 356362.67 362678.46, 356382.85 362654.5, 356488.42 362741.75, 356414.57 362826.04, 356652.88 362572.56, 356402.7 362384.79, 356205.35 362159.02, 356069.83 362316.55, 356056.8 362334.26, 356051.06 362334.96, 355943.48 362290.95, 355924.29 362492.89, 355931.72 362495.13, 355940.2 362390.88, 355947.7 362297.1, 356063.49 362345.51, 356074.42 362421.96, 356082.49 362454.89, 356080.37 362485.7))'), 26191)), 4326)),
    ST_X(ST_Transform(ST_Centroid(ST_SetSRID(ST_GeomFromText('POLYGON((356080.37 362485.7, 356300.3 362622.77, 356362.67 362678.46, 356382.85 362654.5, 356488.42 362741.75, 356414.57 362826.04, 356652.88 362572.56, 356402.7 362384.79, 356205.35 362159.02, 356069.83 362316.55, 356056.8 362334.26, 356051.06 362334.96, 355943.48 362290.95, 355924.29 362492.89, 355931.72 362495.13, 355940.2 362390.88, 355947.7 362297.1, 356063.49 362345.51, 356074.42 362421.96, 356082.49 362454.89, 356080.37 362485.7))'), 26191)), 4326)),
    NOW(), NOW(), NULL::timestamp without time zone,
    'zt-free-zone', 'region-rab', 'admin@industria.ma'
WHERE NOT EXISTS (SELECT 1 FROM zone WHERE id = 'zone-zaina')

UNION ALL

-- Zone Logistique OTTAWA (ex-Haidara) - Coordonnées Lambert précises
SELECT 
    'zone-ottawa', 'OTTAWA', 'Plateforme logistique moderne au Maroc', 'Zone industrielle Ottawa',
    181100.01, 2800, 'PER_SQUARE_METER', 'TURNKEY', 'LIBRE',
    ST_SetSRID(ST_GeomFromText('POLYGON((351900.19 363533.59, 351989.68 363531.3, 351988.73 363461.25, 352188.64 363456.87, 352187.55 363381.01, 352384.73 363378.29, 352381.99 363232.45, 352287.38 363208.55, 352241.53 363105.9, 352244.52 363034.29, 352303.18 362994.99, 352241.33 362969.6, 352074.35 362901.55, 351963.88 362855.44, 351980.16 362887.19, 352030.09 363036.02, 352045.39 363088.39, 351909.06 363178.15, 351931.83 363461.12, 351900.19 363533.59))'), 26191),
    26191,
    ST_Y(ST_Transform(ST_Centroid(ST_SetSRID(ST_GeomFromText('POLYGON((351900.19 363533.59, 351989.68 363531.3, 351988.73 363461.25, 352188.64 363456.87, 352187.55 363381.01, 352384.73 363378.29, 352381.99 363232.45, 352287.38 363208.55, 352241.53 363105.9, 352244.52 363034.29, 352303.18 362994.99, 352241.33 362969.6, 352074.35 362901.55, 351963.88 362855.44, 351980.16 362887.19, 352030.09 363036.02, 352045.39 363088.39, 351909.06 363178.15, 351931.83 363461.12, 351900.19 363533.59))'), 26191)), 4326)),
    ST_X(ST_Transform(ST_Centroid(ST_SetSRID(ST_GeomFromText('POLYGON((351900.19 363533.59, 351989.68 363531.3, 351988.73 363461.25, 352188.64 363456.87, 352187.55 363381.01, 352384.73 363378.29, 352381.99 363232.45, 352287.38 363208.55, 352241.53 363105.9, 352244.52 363034.29, 352303.18 362994.99, 352241.33 362969.6, 352074.35 362901.55, 351963.88 362855.44, 351980.16 362887.19, 352030.09 363036.02, 352045.39 363088.39, 351909.06 363178.15, 351931.83 363461.12, 351900.19 363533.59))'), 26191)), 4326)),
    NOW(), NOW(), NULL::timestamp without time zone,
    'zt-logistics', 'region-rab', 'admin@industria.ma'
WHERE NOT EXISTS (SELECT 1 FROM zone WHERE id = 'zone-ottawa')

UNION ALL

-- Zone additionnelle Marrakech
SELECT 
    'zone-marrakech-1', 'Zone Industrielle Marrakech Sud', 'Zone industrielle avec avantages fiscaux', 'Route de l''Aéroport, Marrakech',
    95000, 2000, 'PER_SQUARE_METER', 'CUSTOM_BUILD', 'LIBRE',
    ST_SetSRID(ST_GeomFromText('POLYGON((280000 315000, 280200 315000, 280200 315200, 280000 315200, 280000 315000))'), 26191),
    26191,
    ST_Y(ST_Transform(ST_Centroid(ST_SetSRID(ST_GeomFromText('POLYGON((280000 315000, 280200 315000, 280200 315200, 280000 315200, 280000 315000))'), 26191)), 4326)),
    ST_X(ST_Transform(ST_Centroid(ST_SetSRID(ST_GeomFromText('POLYGON((280000 315000, 280200 315000, 280200 315200, 280000 315200, 280000 315000))'), 26191)), 4326)),
    NOW(), NOW(), NULL::timestamp without time zone,
    'zt-private', 'region-mar', 'admin@industria.ma'
WHERE NOT EXISTS (SELECT 1 FROM zone WHERE id = 'zone-marrakech-1')

UNION ALL

-- Zone en France - Parc Industriel Lyon Sud (zone agrandie - 2km x 2km)
-- Utilisation du système Lambert 93 (EPSG:2154) pour la France
-- Coordonnées Lambert 93 réelles pour la région de Lyon
SELECT 
    'zone-lyon-sud', 'Parc Industriel Lyon Sud', 'Zone industrielle moderne près de Lyon avec accès autoroutier', 'Lyon Sud, Rhône, France',
    4000000, 150, 'PER_SQUARE_METER', 'TURNKEY', 'LIBRE',
    ST_SetSRID(ST_GeomFromText('POLYGON((842000 6517000, 844000 6517000, 844000 6519000, 842000 6519000, 842000 6517000))'), 2154),
    2154,
    ST_Y(ST_Transform(ST_Centroid(ST_SetSRID(ST_GeomFromText('POLYGON((842000 6517000, 844000 6517000, 844000 6519000, 842000 6519000, 842000 6517000))'), 2154)), 4326)),
    ST_X(ST_Transform(ST_Centroid(ST_SetSRID(ST_GeomFromText('POLYGON((842000 6517000, 844000 6517000, 844000 6519000, 842000 6519000, 842000 6517000))'), 2154)), 4326)),
    NOW(), NOW(), NULL::timestamp without time zone,
    'zt-public', 'region-ara-lyon', 'admin@industria.ma'
WHERE NOT EXISTS (SELECT 1 FROM zone WHERE id = 'zone-lyon-sud')

;



-- 2) Parcelles avec coordonnées Lambert précises et calcul auto des lat/lon
INSERT INTO parcel (
    id, reference, area, status, is_showroom, cos, cus, height_limit, setback,
    geometry, srid, latitude, longitude, created_at, updated_at, deleted_at, zone_id, created_by
)

-- Parcel CAS-001
SELECT 
    'parcel-1', 'CAS-001', 10000, 'LIBRE', false, 0.6, 1.2, 15.0, 5.0,
    ST_SetSRID(ST_GeomFromText('POLYGON((423450 372880, 423480 372880, 423480 372910, 423450 372910, 423450 372880))'), 26191),
    26191,
    ST_Y(ST_Transform(ST_Centroid(ST_SetSRID(ST_GeomFromText('POLYGON((423450 372880, 423480 372880, 423480 372910, 423450 372910, 423450 372880))'), 26191)), 4326)),
    ST_X(ST_Transform(ST_Centroid(ST_SetSRID(ST_GeomFromText('POLYGON((423450 372880, 423480 372880, 423480 372910, 423450 372910, 423450 372880))'), 26191)), 4326)),
    NOW(), NOW(), NULL::timestamp without time zone, 'zone-demo', 'admin@industria.ma'
WHERE NOT EXISTS (SELECT 1 FROM parcel WHERE id = 'parcel-1')

UNION ALL

-- Parcel CAS-002
SELECT 
    'parcel-2', 'CAS-002', 12000, 'RESERVEE', false, 0.7, 1.4, 18.0, 4.0,
    ST_SetSRID(ST_GeomFromText('POLYGON((423500 372890, 423530 372890, 423530 372920, 423500 372920, 423500 372890))'), 26191),
    26191,
    ST_Y(ST_Transform(ST_Centroid(ST_SetSRID(ST_GeomFromText('POLYGON((423500 372890, 423530 372890, 423530 372920, 423500 372920, 423500 372890))'), 26191)), 4326)),
    ST_X(ST_Transform(ST_Centroid(ST_SetSRID(ST_GeomFromText('POLYGON((423500 372890, 423530 372890, 423530 372920, 423500 372920, 423500 372890))'), 26191)), 4326)),
    NOW(), NOW(), NULL::timestamp without time zone, 'zone-demo', 'admin@industria.ma'
WHERE NOT EXISTS (SELECT 1 FROM parcel WHERE id = 'parcel-2')

UNION ALL

-- Parcel CAS-NORD-001
SELECT 
    'parcel-3', 'CAS-NORD-001', 15000, 'LIBRE', false, 0.65, 1.3, 20.0, 6.0,
    ST_SetSRID(ST_GeomFromText('POLYGON((424050 373550, 424080 373550, 424080 373580, 424050 373580, 424050 373550))'), 26191),
    26191,
    ST_Y(ST_Transform(ST_Centroid(ST_SetSRID(ST_GeomFromText('POLYGON((424050 373550, 424080 373550, 424080 373580, 424050 373580, 424050 373550))'), 26191)), 4326)),
    ST_X(ST_Transform(ST_Centroid(ST_SetSRID(ST_GeomFromText('POLYGON((424050 373550, 424080 373550, 424080 373580, 424050 373580, 424050 373550))'), 26191)), 4326)),
    NOW(), NOW(), NULL::timestamp without time zone, 'zone-casa-nord', 'admin@industria.ma'
WHERE NOT EXISTS (SELECT 1 FROM parcel WHERE id = 'parcel-3')

UNION ALL

-- Parcelles France - Lyon Sud (parcelles agrandies dans la zone en Lambert 93)
SELECT 
    'parcel-lyon-1', 'LYS-001', 500000, 'LIBRE', false, 0.8, 1.6, 25.0, 8.0,
    ST_SetSRID(ST_GeomFromText('POLYGON((842200 6517200, 842800 6517200, 842800 6517800, 842200 6517800, 842200 6517200))'), 2154),
    2154,
    ST_Y(ST_Transform(ST_Centroid(ST_SetSRID(ST_GeomFromText('POLYGON((842200 6517200, 842800 6517200, 842800 6517800, 842200 6517800, 842200 6517200))'), 2154)), 4326)),
    ST_X(ST_Transform(ST_Centroid(ST_SetSRID(ST_GeomFromText('POLYGON((842200 6517200, 842800 6517200, 842800 6517800, 842200 6517800, 842200 6517200))'), 2154)), 4326)),
    NOW(), NOW(), NULL::timestamp without time zone, 'zone-lyon-sud', 'admin@industria.ma'
WHERE NOT EXISTS (SELECT 1 FROM parcel WHERE id = 'parcel-lyon-1')

UNION ALL

-- Parcelle Lyon 2
SELECT 
    'parcel-lyon-2', 'LYS-002', 600000, 'RESERVEE', true, 0.7, 1.5, 20.0, 6.0,
    ST_SetSRID(ST_GeomFromText('POLYGON((843000 6517200, 843600 6517200, 843600 6517800, 843000 6517800, 843000 6517200))'), 2154),
    2154,
    ST_Y(ST_Transform(ST_Centroid(ST_SetSRID(ST_GeomFromText('POLYGON((843000 6517200, 843600 6517200, 843600 6517800, 843000 6517800, 843000 6517200))'), 2154)), 4326)),
    ST_X(ST_Transform(ST_Centroid(ST_SetSRID(ST_GeomFromText('POLYGON((843000 6517200, 843600 6517200, 843600 6517800, 843000 6517800, 843000 6517200))'), 2154)), 4326)),
    NOW(), NOW(), NULL::timestamp without time zone, 'zone-lyon-sud', 'admin@industria.ma'
WHERE NOT EXISTS (SELECT 1 FROM parcel WHERE id = 'parcel-lyon-2')

UNION ALL

-- Parcelle Lyon 3
SELECT 
    'parcel-lyon-3', 'LYS-003', 700000, 'LIBRE', false, 0.9, 1.8, 30.0, 8.0,
    ST_SetSRID(ST_GeomFromText('POLYGON((842200 6518000, 843000 6518000, 843000 6518800, 842200 6518800, 842200 6518000))'), 2154),
    2154,
    ST_Y(ST_Transform(ST_Centroid(ST_SetSRID(ST_GeomFromText('POLYGON((842200 6518000, 843000 6518000, 843000 6518800, 842200 6518800, 842200 6518000))'), 2154)), 4326)),
    ST_X(ST_Transform(ST_Centroid(ST_SetSRID(ST_GeomFromText('POLYGON((842200 6518000, 843000 6518000, 843000 6518800, 842200 6518800, 842200 6518000))'), 2154)), 4326)),
    NOW(), NOW(), NULL::timestamp without time zone, 'zone-lyon-sud', 'admin@industria.ma'
WHERE NOT EXISTS (SELECT 1 FROM parcel WHERE id = 'parcel-lyon-3')

;



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
    ('za-8', 'zone-marrakech-1', 'act-textile'),
    ('za-9', 'zone-lyon-sud', 'act-auto'),
    ('za-10', 'zone-lyon-sud', 'act-pharma')
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
    ('zam-17', 'zone-marrakech-1', 'amn-water'),
    ('zam-18', 'zone-lyon-sud', 'amn-electricity'),
    ('zam-19', 'zone-lyon-sud', 'amn-water'),
    ('zam-20', 'zone-lyon-sud', 'amn-internet'),
    ('zam-21', 'zone-lyon-sud', 'amn-security'),
    ('zam-22', 'zone-lyon-sud', 'amn-parking')
) AS d(id, zone_id, amenity_id)
WHERE NOT EXISTS (SELECT 1 FROM zone_amenity WHERE id = d.id);


-- ================================================
-- ZONES ET PARCELLES DE TEST CASABLANCA
-- ================================================

-- Zone de test avec coordonnées Lambert réalistes pour Casablanca
-- Projection Lambert Conformal Conic Maroc (EPSG:26191)

-- 1. Zone principale Casablanca Test (1km x 1km) - Coordonnées réelles Casablanca
INSERT INTO zone (
    id, name, description, address, total_area, price, price_type, construction_type, status,
    geometry, srid, region_id, zone_type_id, created_by, created_at, updated_at
) VALUES (
    'casa-test-zone-001',
    'Parc Industriel Casablanca Test',
    'Zone de test pour les réservations avec parcelles disponibles',
    'Aín Sebaá, Casablanca, Maroc',
    1000000.0,  -- 1 km²
    1500.0,     -- 1500 DH/m²
    'PER_SQUARE_METER',
    'CUSTOM_BUILD',
    'LIBRE',
    ST_SetSRID(ST_GeomFromText('POLYGON((423000 373000, 424000 373000, 424000 374000, 423000 374000, 423000 373000))'), 26191),
    26191,  -- EPSG Lambert Maroc
    'region-cas',
    'zt-private',
    'admin@industria.ma',
    NOW(),
    NOW()
);

-- 2. Zone supplémentaire Casablanca Test (5 hectares) - Coordonnées réelles Mohammedia
INSERT INTO zone (
    id, name, description, address, total_area, price, price_type, construction_type, status,
    geometry, srid, region_id, zone_type_id, created_by, created_at, updated_at
) VALUES (
    'test-zone-casa-001',
    'Parc Industriel Mohammedia Test',
    'Deuxième zone de test avec parcelles variées',
    'Mohammedia, Casablanca-Settat, Maroc',
    50000.0,  -- 5 hectares
    1800.0,   -- 1800 DH/m²
    'PER_SQUARE_METER',
    'CUSTOM_BUILD',
    'LIBRE',
    ST_SetSRID(ST_GeomFromText('POLYGON((425000 370000, 425500 370000, 425500 370500, 425000 370500, 425000 370000))'), 26191),
    26191,
    'region-cas',
    'zt-private',
    'admin@industria.ma',
    NOW(),
    NOW()
);

-- Activités pour les zones de test
INSERT INTO zone_activity (id, zone_id, activity_id) VALUES
('casa-za-1', 'casa-test-zone-001', 'act-auto'),
('casa-za-2', 'casa-test-zone-001', 'act-log'),
('test-za-1', 'test-zone-casa-001', 'act-auto'),
('test-za-2', 'test-zone-casa-001', 'act-log');

-- Équipements pour les zones de test
INSERT INTO zone_amenity (id, zone_id, amenity_id) VALUES
('casa-zam-1', 'casa-test-zone-001', 'amn-electricity'),
('casa-zam-2', 'casa-test-zone-001', 'amn-water'),
('casa-zam-3', 'casa-test-zone-001', 'amn-internet'),
('casa-zam-4', 'casa-test-zone-001', 'amn-security'),
('test-zam-1', 'test-zone-casa-001', 'amn-electricity'),
('test-zam-2', 'test-zone-casa-001', 'amn-water'),
('test-zam-3', 'test-zone-casa-001', 'amn-internet'),
('test-zam-4', 'test-zone-casa-001', 'amn-security');

-- Parcelles pour zone casa-test-zone-001 (répartition 3x3 dans 1km x 1km) - Coordonnées Casablanca
INSERT INTO parcel (
    id, reference, area, status, is_showroom, zone_id,
    geometry, srid, created_by, created_at, updated_at
) VALUES
-- Ligne du haut (nord)
('casa-parcel-a1', 'CAS-A001', 111111.11, 'LIBRE', false, 'casa-test-zone-001',
 ST_SetSRID(ST_GeomFromText('POLYGON((423000 373666, 423333 373666, 423333 374000, 423000 374000, 423000 373666))'), 26191), 26191, 'admin@industria.ma', NOW(), NOW()),
('casa-parcel-a2', 'CAS-A002', 111111.11, 'LIBRE', true, 'casa-test-zone-001',
 ST_SetSRID(ST_GeomFromText('POLYGON((423333 373666, 423666 373666, 423666 374000, 423333 374000, 423333 373666))'), 26191), 26191, 'admin@industria.ma', NOW(), NOW()),
('casa-parcel-a3', 'CAS-A003', 111111.11, 'LIBRE', false, 'casa-test-zone-001',
 ST_SetSRID(ST_GeomFromText('POLYGON((423666 373666, 424000 373666, 424000 374000, 423666 374000, 423666 373666))'), 26191), 26191, 'admin@industria.ma', NOW(), NOW()),

-- Ligne du milieu
('casa-parcel-b1', 'CAS-B001', 111111.11, 'LIBRE', false, 'casa-test-zone-001',
 ST_SetSRID(ST_GeomFromText('POLYGON((423000 373333, 423333 373333, 423333 373666, 423000 373666, 423000 373333))'), 26191), 26191, 'admin@industria.ma', NOW(), NOW()),
('casa-parcel-b2', 'CAS-B002', 111111.11, 'RESERVEE', false, 'casa-test-zone-001',
 ST_SetSRID(ST_GeomFromText('POLYGON((423333 373333, 423666 373333, 423666 373666, 423333 373666, 423333 373333))'), 26191), 26191, 'admin@industria.ma', NOW(), NOW()),
('casa-parcel-b3', 'CAS-B003', 111111.11, 'LIBRE', false, 'casa-test-zone-001',
 ST_SetSRID(ST_GeomFromText('POLYGON((423666 373333, 424000 373333, 424000 373666, 423666 373666, 423666 373333))'), 26191), 26191, 'admin@industria.ma', NOW(), NOW()),

-- Ligne du bas (sud)
('casa-parcel-c1', 'CAS-C001', 111111.11, 'LIBRE', false, 'casa-test-zone-001',
 ST_SetSRID(ST_GeomFromText('POLYGON((423000 373000, 423333 373000, 423333 373333, 423000 373333, 423000 373000))'), 26191), 26191, 'admin@industria.ma', NOW(), NOW()),
('casa-parcel-c2', 'CAS-C002', 111111.11, 'VENDU', false, 'casa-test-zone-001',
 ST_SetSRID(ST_GeomFromText('POLYGON((423333 373000, 423666 373000, 423666 373333, 423333 373333, 423333 373000))'), 26191), 26191, 'admin@industria.ma', NOW(), NOW()),
('casa-parcel-c3', 'CAS-C003', 111111.11, 'LIBRE', false, 'casa-test-zone-001',
 ST_SetSRID(ST_GeomFromText('POLYGON((423666 373000, 424000 373000, 424000 373333, 423666 373333, 423666 373000))'), 26191), 26191, 'admin@industria.ma', NOW(), NOW());

-- Parcelles pour zone test-zone-casa-001 (parcelles variées) - Coordonnées Mohammedia
INSERT INTO parcel (
    id, reference, area, status, is_showroom, zone_id,
    geometry, srid, created_by, created_at, updated_at
) VALUES
-- Parcelles de différentes tailles
('test-parcel-a1', 'MOH-A001', 2500.0, 'LIBRE', false, 'test-zone-casa-001',
 ST_SetSRID(ST_GeomFromText('POLYGON((425000 370000, 425125 370000, 425125 370200, 425000 370200, 425000 370000))'), 26191), 26191, 'admin@industria.ma', NOW(), NOW()),
('test-parcel-a2', 'MOH-A002', 3000.0, 'LIBRE', true, 'test-zone-casa-001',
 ST_SetSRID(ST_GeomFromText('POLYGON((425125 370000, 425250 370000, 425250 370200, 425125 370200, 425125 370000))'), 26191), 26191, 'admin@industria.ma', NOW(), NOW()),
('test-parcel-b1', 'MOH-B001', 4000.0, 'LIBRE', false, 'test-zone-casa-001',
 ST_SetSRID(ST_GeomFromText('POLYGON((425250 370000, 425400 370000, 425400 370200, 425250 370200, 425250 370000))'), 26191), 26191, 'admin@industria.ma', NOW(), NOW()),
('test-parcel-b2', 'MOH-B002', 2800.0, 'RESERVEE', false, 'test-zone-casa-001',
 ST_SetSRID(ST_GeomFromText('POLYGON((425400 370000, 425500 370000, 425500 370200, 425400 370200, 425400 370000))'), 26191), 26191, 'admin@industria.ma', NOW(), NOW()),
('test-parcel-c1', 'MOH-C001', 6000.0, 'LIBRE', false, 'test-zone-casa-001',
 ST_SetSRID(ST_GeomFromText('POLYGON((425000 370200, 425200 370200, 425200 370400, 425000 370400, 425000 370200))'), 26191), 26191, 'admin@industria.ma', NOW(), NOW()),
('test-parcel-c2', 'MOH-C002', 3500.0, 'LIBRE', false, 'test-zone-casa-001',
 ST_SetSRID(ST_GeomFromText('POLYGON((425200 370200, 425350 370200, 425350 370400, 425200 370400, 425200 370200))'), 26191), 26191, 'admin@industria.ma', NOW(), NOW()),
('test-parcel-d1', 'MOH-D001', 2200.0, 'VENDU', false, 'test-zone-casa-001',
 ST_SetSRID(ST_GeomFromText('POLYGON((425350 370200, 425500 370200, 425500 370400, 425350 370400, 425350 370200))'), 26191), 26191, 'admin@industria.ma', NOW(), NOW());

-- Calculer automatiquement les coordonnées WGS84 avec PostGIS pour toutes les zones de test
UPDATE zone SET 
  longitude = ST_X(ST_Transform(ST_Centroid(geometry), 4326)),
  latitude = ST_Y(ST_Transform(ST_Centroid(geometry), 4326))
WHERE id IN ('casa-test-zone-001', 'test-zone-casa-001');

-- Zone et parcelles de test pour le ZONE_MANAGER (user-manager)
INSERT INTO zone (
    id, name, description, address, total_area, price, price_type, construction_type, status,
    geometry, srid, region_id, zone_type_id, created_by, created_at, updated_at
) VALUES (
    'manager-zone-001',
    'Zone Manager Test',
    'Zone de test créée par le Zone Manager',
    'Zone Test Manager, Casablanca',
    25000.0,  -- 2.5 hectares
    2000.0,   -- 2000 DH/m²
    'PER_SQUARE_METER',
    'CUSTOM_BUILD',
    'LIBRE',
    ST_SetSRID(ST_GeomFromText('POLYGON((426000 375000, 426500 375000, 426500 375500, 426000 375500, 426000 375000))'), 26191),
    26191,
    'region-cas',
    'zt-private',
    'manager@industria.ma',  -- Créé par le manager
    NOW(),
    NOW()
);

-- Parcelles pour le zone manager
INSERT INTO parcel (
    id, reference, area, status, is_showroom, zone_id,
    geometry, srid, created_by, created_at, updated_at
) VALUES
('manager-parcel-1', 'MGR-001', 5000.0, 'LIBRE', false, 'manager-zone-001',
 ST_SetSRID(ST_GeomFromText('POLYGON((426000 375000, 426250 375000, 426250 375250, 426000 375250, 426000 375000))'), 26191), 
 26191, 'manager@industria.ma', NOW(), NOW()),
('manager-parcel-2', 'MGR-002', 7500.0, 'RESERVEE', false, 'manager-zone-001',
 ST_SetSRID(ST_GeomFromText('POLYGON((426250 375000, 426500 375000, 426500 375250, 426250 375250, 426250 375000))'), 26191), 
 26191, 'manager@industria.ma', NOW(), NOW()),
('manager-parcel-3', 'MGR-003', 6000.0, 'LIBRE', true, 'manager-zone-001',
 ST_SetSRID(ST_GeomFromText('POLYGON((426000 375250, 426300 375250, 426300 375500, 426000 375500, 426000 375250))'), 26191), 
 26191, 'manager@industria.ma', NOW(), NOW()),
('manager-parcel-4', 'MGR-004', 6500.0, 'VENDU', false, 'manager-zone-001',
 ST_SetSRID(ST_GeomFromText('POLYGON((426300 375250, 426500 375250, 426500 375500, 426300 375500, 426300 375250))'), 26191), 
 26191, 'manager@industria.ma', NOW(), NOW());

-- Activités pour la zone du manager
INSERT INTO zone_activity (id, zone_id, activity_id) VALUES
('manager-za-1', 'manager-zone-001', 'act-textile'),
('manager-za-2', 'manager-zone-001', 'act-log');

-- Équipements pour la zone du manager
INSERT INTO zone_amenity (id, zone_id, amenity_id) VALUES
('manager-zam-1', 'manager-zone-001', 'amn-electricity'),
('manager-zam-2', 'manager-zone-001', 'amn-water'),
('manager-zam-3', 'manager-zone-001', 'amn-internet');

-- Calculer automatiquement les coordonnées WGS84 avec PostGIS pour toutes les parcelles de test
UPDATE parcel SET 
  longitude = ST_X(ST_Transform(ST_Centroid(geometry), 4326)),
  latitude = ST_Y(ST_Transform(ST_Centroid(geometry), 4326))
WHERE zone_id IN ('casa-test-zone-001', 'test-zone-casa-001', 'manager-zone-001');

UPDATE zone SET 
  longitude = ST_X(ST_Transform(ST_Centroid(geometry), 4326)),
  latitude = ST_Y(ST_Transform(ST_Centroid(geometry), 4326))
WHERE id IN ('casa-test-zone-001', 'test-zone-casa-001', 'manager-zone-001');

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
