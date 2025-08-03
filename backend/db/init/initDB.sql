-- initDB.sql - Données d'exemple pour la plateforme Industria
-- Version optimisée pour model-first avec Hibernate

-- Activer les extensions nécessaires (si pas déjà fait par Hibernate)
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Création des tables si elles n'existent pas
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(255) PRIMARY KEY,
    email VARCHAR(255),
    password VARCHAR(255),
    name VARCHAR(255),
    company VARCHAR(255),
    phone VARCHAR(255),
    role VARCHAR(50),
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    deleted_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS spatial_reference_system (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255),
    srid INTEGER,
    proj4text VARCHAR(255),
    description VARCHAR(255),
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    deleted_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS country (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255),
    code VARCHAR(50),
    currency VARCHAR(50),
    default_srid INTEGER,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    deleted_at TIMESTAMP,
    srs_id VARCHAR(255),
    CONSTRAINT fk_country_srs FOREIGN KEY (srs_id) REFERENCES spatial_reference_system(id)
);

CREATE TABLE IF NOT EXISTS region (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255),
    code VARCHAR(50),
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    deleted_at TIMESTAMP,
    country_id VARCHAR(255),
    CONSTRAINT fk_region_country FOREIGN KEY (country_id) REFERENCES country(id)
);

CREATE TABLE IF NOT EXISTS zone_type (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255),
    description VARCHAR(255),
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    deleted_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS activity (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255),
    description VARCHAR(255),
    icon VARCHAR(255),
    category VARCHAR(255),
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    deleted_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS amenity (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255),
    description VARCHAR(255),
    icon VARCHAR(255),
    category VARCHAR(255),
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    deleted_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS zone (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255),
    description VARCHAR(255),
    address VARCHAR(255),
    total_area DOUBLE PRECISION,
    price DOUBLE PRECISION,
    price_type VARCHAR(50),
    construction_type VARCHAR(50),
    status VARCHAR(50),
    geometry TEXT,
    srid INTEGER,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    deleted_at TIMESTAMP,
    zone_type_id VARCHAR(255),
    region_id VARCHAR(255),
    created_by VARCHAR(255),
    CONSTRAINT fk_zone_zone_type FOREIGN KEY (zone_type_id) REFERENCES zone_type(id),
    CONSTRAINT fk_zone_region FOREIGN KEY (region_id) REFERENCES region(id),
    CONSTRAINT fk_zone_user FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS parcel (
    id VARCHAR(255) PRIMARY KEY,
    reference VARCHAR(255),
    area DOUBLE PRECISION,
    status VARCHAR(50),
    is_showroom BOOLEAN,
    cos DOUBLE PRECISION,
    cus DOUBLE PRECISION,
    height_limit DOUBLE PRECISION,
    setback DOUBLE PRECISION,
    geometry TEXT,
    srid INTEGER,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    deleted_at TIMESTAMP,
    zone_id VARCHAR(255),
    created_by VARCHAR(255),
    CONSTRAINT fk_parcel_zone FOREIGN KEY (zone_id) REFERENCES zone(id),
    CONSTRAINT fk_parcel_user FOREIGN KEY (created_by) REFERENCES users(id)
);
CREATE INDEX IF NOT EXISTS idx_parcel_zone_id ON parcel(zone_id);

CREATE TABLE IF NOT EXISTS appointment (
    id VARCHAR(255) PRIMARY KEY,
    contact_name VARCHAR(255),
    contact_email VARCHAR(255),
    contact_phone VARCHAR(255),
    company_name VARCHAR(255),
    message VARCHAR(255),
    requested_date TIMESTAMP,
    confirmed_date TIMESTAMP,
    status VARCHAR(50),
    notes VARCHAR(255),
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    deleted_at TIMESTAMP,
    parcel_id VARCHAR(255),
    managed_by VARCHAR(255),
    CONSTRAINT fk_appointment_parcel FOREIGN KEY (parcel_id) REFERENCES parcel(id),
    CONSTRAINT fk_appointment_user FOREIGN KEY (managed_by) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS zone_activity (
    id VARCHAR(255) PRIMARY KEY,
    zone_id VARCHAR(255),
    activity_id VARCHAR(255),
    CONSTRAINT fk_zone_activity_zone FOREIGN KEY (zone_id) REFERENCES zone(id),
    CONSTRAINT fk_zone_activity_activity FOREIGN KEY (activity_id) REFERENCES activity(id)
);

CREATE TABLE IF NOT EXISTS zone_amenity (
    id VARCHAR(255) PRIMARY KEY,
    zone_id VARCHAR(255),
    amenity_id VARCHAR(255),
    CONSTRAINT fk_zone_amenity_zone FOREIGN KEY (zone_id) REFERENCES zone(id),
    CONSTRAINT fk_zone_amenity_amenity FOREIGN KEY (amenity_id) REFERENCES amenity(id)
);

CREATE TABLE IF NOT EXISTS parcel_amenity (
    id VARCHAR(255) PRIMARY KEY,
    parcel_id VARCHAR(255),
    amenity_id VARCHAR(255),
    CONSTRAINT fk_parcel_amenity_parcel FOREIGN KEY (parcel_id) REFERENCES parcel(id),
    CONSTRAINT fk_parcel_amenity_amenity FOREIGN KEY (amenity_id) REFERENCES amenity(id)
);

CREATE TABLE IF NOT EXISTS notification_template (
    id VARCHAR(255) PRIMARY KEY,
    type VARCHAR(50),
    subject VARCHAR(255),
    html_body TEXT,
    text_body TEXT,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS notification (
    id VARCHAR(255) PRIMARY KEY,
    recipient_email VARCHAR(255),
    recipient_name VARCHAR(255),
    subject VARCHAR(255),
    html_body TEXT,
    text_body TEXT,
    status VARCHAR(50),
    sent_at TIMESTAMP,
    failure_reason VARCHAR(255),
    retry_count INTEGER,
    max_retries INTEGER,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    template_id VARCHAR(255),
    CONSTRAINT fk_notification_template FOREIGN KEY (template_id) REFERENCES notification_template(id)
);

CREATE TABLE IF NOT EXISTS audit_log (
    id VARCHAR(255) PRIMARY KEY,
    action VARCHAR(50),
    entity VARCHAR(255),
    entity_id VARCHAR(255),
    old_values TEXT,
    new_values TEXT,
    description VARCHAR(255),
    ip_address VARCHAR(255),
    user_agent VARCHAR(255),
    created_at TIMESTAMP,
    user_id VARCHAR(255),
    CONSTRAINT fk_audit_log_user FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Fonction pour vérifier l'existence des données
CREATE OR REPLACE FUNCTION data_already_exists() RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (SELECT 1 FROM users LIMIT 1);
END;
$$ LANGUAGE plpgsql;

-- Ne procéder que si les données n'existent pas déjà
DO $$
BEGIN
    IF data_already_exists() THEN
        RAISE NOTICE 'Data already exists. Skipping initialization.';
        RETURN;
    END IF;
    
    RAISE NOTICE 'Initializing database with sample data...';
END $$;

-- Vérification des tables requises avant insertion
DO $$
DECLARE
    missing_tables TEXT[] := ARRAY[]::TEXT[];
    required_tables TEXT[] := ARRAY[
        'users', 'country', 'region', 'zone_type', 'zone', 'parcel',
        'activity', 'amenity', 'spatial_reference_system',
        'zone_activity', 'zone_amenity', 'parcel_amenity', 'appointment', 'notification_template'
    ];
    tbl TEXT;
BEGIN
    FOREACH tbl IN ARRAY required_tables LOOP
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_name = tbl
        ) THEN
            missing_tables := array_append(missing_tables, tbl);
        END IF;
    END LOOP;
    
    IF array_length(missing_tables, 1) > 0 THEN
        RAISE EXCEPTION 'Missing required tables: %', array_to_string(missing_tables, ', ');
    END IF;
    
    RAISE NOTICE 'All required tables found. Proceeding with data insertion...';
END $$;

-- Insertion des données seulement si les tables sont vides
-- Users (avec gestion des conflits)
INSERT INTO users (
    id, email, password, name, company, phone, role,
    created_at, updated_at, deleted_at
)
SELECT * FROM (VALUES
    ('user-admin', 'admin@zonespro.ma', '$2b$10$VQl88VBIZ6aR46F7Ju2sgO0LH8oTFbm0Mb8ayY1KeuU261EfwEnZS',
     'Administrateur ZonesPro', 'ZonesPro Management', '+212 5 37 57 20 00', 'ADMIN', NOW(), NOW(), NULL),
    ('user-manager', 'manager@zonespro.ma', '$2b$10$VQl88VBIZ6aR46F7Ju2sgO0LH8oTFbm0Mb8ayY1KeuU261EfwEnZS',
     'Manager Commercial', 'ZonesPro Management', '+212 5 37 57 20 01', 'ZONE_MANAGER', NOW(), NOW(), NULL),
    ('user-demo', 'demo@entreprise.ma', '$2b$10$VQl88VBIZ6aR46F7Ju2sgO0LH8oTFbm0Mb8ayY1KeuU261EfwEnZS',
     'Utilisateur Démo', 'Entreprise Démo SA', '+212 6 12 34 56 78', 'USER', NOW(), NOW(), NULL)
) AS data(id, email, password, name, company, phone, role, created_at, updated_at, deleted_at)
WHERE NOT EXISTS (SELECT 1 FROM users);

-- Spatial reference system
INSERT INTO spatial_reference_system (
    id, name, srid, proj4text, description, created_at, updated_at, deleted_at
)
SELECT * FROM (VALUES (
    'srs-4326', 'WGS 84', 4326, '+proj=longlat +datum=WGS84 +no_defs',
    'Default geodetic system', NOW(), NOW(), NULL
)) AS data(id, name, srid, proj4text, description, created_at, updated_at, deleted_at)
WHERE NOT EXISTS (SELECT 1 FROM spatial_reference_system);

-- Countries
INSERT INTO country (
    id, name, code, currency, default_srid, created_at, updated_at, deleted_at, srs_id
)
SELECT * FROM (VALUES (
    'country-ma', 'Maroc', 'MA', 'MAD', 4326, NOW(), NOW(), NULL, 'srs-4326'
)) AS data(id, name, code, currency, default_srid, created_at, updated_at, deleted_at, srs_id)
WHERE NOT EXISTS (SELECT 1 FROM country);

-- Regions
INSERT INTO region (
    id, name, code, created_at, updated_at, deleted_at, country_id
)
SELECT * FROM (VALUES
    ('region-cas', 'Casablanca-Settat', 'CAS', NOW(), NOW(), NULL, 'country-ma'),
    ('region-rab', 'Rabat-Salé-Kénitra', 'RAB', NOW(), NOW(), NULL, 'country-ma')
) AS data(id, name, code, created_at, updated_at, deleted_at, country_id)
WHERE NOT EXISTS (SELECT 1 FROM region);

-- Zone types
INSERT INTO zone_type (
    id, name, description, created_at, updated_at, deleted_at
)
SELECT * FROM (VALUES
    ('zt-private', 'Privée', 'Zone à gestion privée', NOW(), NOW(), NULL),
    ('zt-public', 'Publique', 'Zone à gestion publique', NOW(), NOW(), NULL)
) AS data(id, name, description, created_at, updated_at, deleted_at)
WHERE NOT EXISTS (SELECT 1 FROM zone_type);

-- Activities
INSERT INTO activity (
    id, name, description, icon, category, created_at, updated_at, deleted_at
)
SELECT * FROM (VALUES
    ('act-auto', 'Automobile', 'Industrie automobile', 'car', 'industrie', NOW(), NOW(), NULL),
    ('act-log', 'Logistique', 'Stockage et distribution', 'package', 'industrie', NOW(), NOW(), NULL),
    ('act-textile', 'Textile', 'Industrie textile', 'shirt', 'industrie', NOW(), NOW(), NULL),
    ('act-pharma', 'Pharmaceutique', 'Industrie pharmaceutique', 'pill', 'industrie', NOW(), NOW(), NULL)
) AS data(id, name, description, icon, category, created_at, updated_at, deleted_at)
WHERE NOT EXISTS (SELECT 1 FROM activity);

-- Amenities
INSERT INTO amenity (
    id, name, description, icon, category, created_at, updated_at, deleted_at
)
SELECT * FROM (VALUES
    ('amn-electricity', 'Électricité', 'Alimentation électrique', 'zap', 'Infrastructure', NOW(), NOW(), NULL),
    ('amn-water', 'Eau potable', 'Réseau d''eau', 'droplet', 'Infrastructure', NOW(), NOW(), NULL),
    ('amn-internet', 'Internet', 'Connexion haut débit', 'wifi', 'Infrastructure', NOW(), NOW(), NULL),
    ('amn-security', 'Sécurité', 'Surveillance 24h/24', 'shield', 'Sécurité', NOW(), NOW(), NULL),
    ('amn-parking', 'Parking', 'Espaces de stationnement', 'car', 'Services', NOW(), NOW(), NULL)
) AS data(id, name, description, icon, category, created_at, updated_at, deleted_at)
WHERE NOT EXISTS (SELECT 1 FROM amenity);

-- Zones
INSERT INTO zone (
    id, name, description, address, total_area, price, price_type,
    construction_type, status, geometry, srid, created_at, updated_at, deleted_at,
    zone_type_id, region_id, created_by
)
SELECT * FROM (VALUES
    ('zone-demo', 'Zone Industrielle Demo', 'Zone de démonstration avec toutes commodités',
     'Route Demo, Casablanca', 150000, 2500, 'PER_SQUARE_METER', 'CUSTOM_BUILD', 'LIBRE',
     'POLYGON((0 0,1 0,1 1,0 1,0 0))', 4326, NOW(), NOW(), NULL,
     'zt-private', 'region-cas', 'user-admin'),
    ('zone-casa-nord', 'Zone Industrielle Casablanca Nord', 'Zone industrielle moderne',
     'Route de Rabat, Casablanca', 200000, 3000, 'PER_SQUARE_METER', 'TURNKEY', 'LIBRE',
     'POLYGON((1 1,2 1,2 2,1 2,1 1))', 4326, NOW(), NOW(), NULL,
     'zt-public', 'region-cas', 'user-admin')
) AS data(id, name, description, address, total_area, price, price_type, construction_type, status, geometry, srid, created_at, updated_at, deleted_at, zone_type_id, region_id, created_by)
WHERE NOT EXISTS (SELECT 1 FROM zone);

-- Parcels
INSERT INTO parcel (
    id, reference, area, status, is_showroom, cos, cus, height_limit, setback,
    geometry, srid, created_at, updated_at, deleted_at, zone_id, created_by
)
SELECT * FROM (VALUES
    ('parcel-1', 'CAS-DEMO-001', 10000, 'LIBRE', false, 0.6, 1.2, 15.0, 5.0,
     'POLYGON((0 0,0.5 0,0.5 0.5,0 0.5,0 0))', 4326, NOW(), NOW(), NULL, 'zone-demo', 'user-admin'),
    ('parcel-2', 'CAS-DEMO-002', 12000, 'RESERVEE', false, 0.7, 1.4, 18.0, 5.0,
     'POLYGON((0.5 0,1 0,1 0.5,0.5 0.5,0.5 0))', 4326, NOW(), NOW(), NULL, 'zone-demo', 'user-admin'),
    ('parcel-3', 'CAS-DEMO-003', 8000, 'LIBRE', true, 0.5, 1.0, 12.0, 3.0,
     'POLYGON((0 0.5,0.5 0.5,0.5 1,0 1,0 0.5))', 4326, NOW(), NOW(), NULL, 'zone-demo', 'user-admin'),
    ('parcel-4', 'CAS-NORD-001', 15000, 'LIBRE', false, 0.8, 1.6, 20.0, 7.0,
     'POLYGON((1 1,1.5 1,1.5 1.5,1 1.5,1 1))', 4326, NOW(), NOW(), NULL, 'zone-casa-nord', 'user-admin')
) AS data(id, reference, area, status, is_showroom, cos, cus, height_limit, setback, geometry, srid, created_at, updated_at, deleted_at, zone_id, created_by)
WHERE NOT EXISTS (SELECT 1 FROM parcel);

-- Zone activities (relations many-to-many)
INSERT INTO zone_activity (id, zone_id, activity_id)
SELECT * FROM (VALUES
    ('za-1', 'zone-demo', 'act-auto'),
    ('za-2', 'zone-demo', 'act-log'),
    ('za-3', 'zone-casa-nord', 'act-textile'),
    ('za-4', 'zone-casa-nord', 'act-pharma')
) AS data(id, zone_id, activity_id)
WHERE NOT EXISTS (SELECT 1 FROM zone_activity);

-- Zone amenities
INSERT INTO zone_amenity (id, zone_id, amenity_id)
SELECT * FROM (VALUES
    ('zam-1', 'zone-demo', 'amn-electricity'),
    ('zam-2', 'zone-demo', 'amn-water'),
    ('zam-3', 'zone-demo', 'amn-internet'),
    ('zam-4', 'zone-demo', 'amn-security'),
    ('zam-5', 'zone-casa-nord', 'amn-electricity'),
    ('zam-6', 'zone-casa-nord', 'amn-water'),
    ('zam-7', 'zone-casa-nord', 'amn-parking')
) AS data(id, zone_id, amenity_id)
WHERE NOT EXISTS (SELECT 1 FROM zone_amenity);

-- Parcel amenities
INSERT INTO parcel_amenity (id, parcel_id, amenity_id)
SELECT * FROM (VALUES
    ('pa-1', 'parcel-1', 'amn-electricity'),
    ('pa-2', 'parcel-1', 'amn-water'),
    ('pa-3', 'parcel-2', 'amn-electricity'),
    ('pa-4', 'parcel-3', 'amn-electricity'),
    ('pa-5', 'parcel-3', 'amn-internet'),
    ('pa-6', 'parcel-4', 'amn-electricity'),
    ('pa-7', 'parcel-4', 'amn-parking')
) AS data(id, parcel_id, amenity_id)
WHERE NOT EXISTS (SELECT 1 FROM parcel_amenity);

-- Appointments
INSERT INTO appointment (
    id, contact_name, contact_email, contact_phone, company_name, message,
    requested_date, confirmed_date, status, notes,
    created_at, updated_at, deleted_at, parcel_id, managed_by
)
SELECT * FROM (VALUES
    ('appt-1', 'Ahmed Benali', 'a.benali@entreprise.ma', '+212 6 12 34 56 78',
     'Industries Benali', 'Intéressé par une parcelle pour activité automobile',
     TIMESTAMP '2024-02-15 10:00:00', NULL, 'PENDING', NULL,
     NOW(), NOW(), NULL, 'parcel-1', 'user-manager'),
    ('appt-2', 'Fatima Alaoui', 'f.alaoui@logistics.ma', '+212 6 87 65 43 21',
     'Logistics Pro', 'Recherche espace pour entrepôt logistique',
     TIMESTAMP '2024-02-20 14:30:00', TIMESTAMP '2024-02-20 14:30:00', 'CONFIRMED', 'RDV confirmé par téléphone',
     NOW(), NOW(), NULL, 'parcel-2', 'user-manager')
) AS data(id, contact_name, contact_email, contact_phone, company_name, message, requested_date, confirmed_date, status, notes, created_at, updated_at, deleted_at, parcel_id, managed_by)
WHERE NOT EXISTS (SELECT 1 FROM appointment);

-- Notification templates (si la table existe)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notification_template') THEN
        INSERT INTO notification_template (
            id, type, subject, html_body, text_body, created_at, updated_at
        )
        SELECT * FROM (VALUES
            ('tmpl-appointment-confirm', 'EMAIL',
             'Confirmation RDV',
             'Votre rendez-vous pour la parcelle {parcel_reference} est confirmé pour le {date}.',
             'Votre rendez-vous pour la parcelle {parcel_reference} est confirmé pour le {date}.',
             NOW(), NOW()),
            ('tmpl-parcel-available', 'EMAIL',
             'Parcelle disponible',
             'Une nouvelle parcelle correspondant à vos critères est disponible : {parcel_reference}.',
             'Une nouvelle parcelle correspondant à vos critères est disponible : {parcel_reference}.',
             NOW(), NOW())
        ) AS data(id, type, subject, html_body, text_body, created_at, updated_at)
        WHERE NOT EXISTS (SELECT 1 FROM notification_template);
    END IF;
END $$;

-- Nettoyage de la fonction temporaire
DROP FUNCTION IF EXISTS data_already_exists();

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