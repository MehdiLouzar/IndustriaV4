-- Script de diagnostic des coordonnées géométriques
-- Pour identifier et corriger les problèmes de coordonnées Lambert

-- 1) Vérifier les coordonnées actuelles des zones
SELECT 
    id,
    name,
    ST_AsText(geometry) as wkt_geometry,
    ST_X(ST_Centroid(geometry)) as lambert_x,
    ST_Y(ST_Centroid(geometry)) as lambert_y,
    latitude,
    longitude,
    ST_SRID(geometry) as srid
FROM zone 
WHERE id = 'zone-piaj';

-- 2) Vérifier si la géométrie est valide
SELECT 
    id,
    name,
    ST_IsValid(geometry) as is_valid,
    ST_IsValidReason(geometry) as validation_reason
FROM zone 
WHERE id = 'zone-piaj';

-- 3) Extraire les vertices individuels
SELECT 
    'zone-piaj' as zone_id,
    (ST_DumpPoints(geometry)).path[1] as vertex_number,
    ST_X((ST_DumpPoints(geometry)).geom) as x_coord,
    ST_Y((ST_DumpPoints(geometry)).geom) as y_coord
FROM zone 
WHERE id = 'zone-piaj'
ORDER BY vertex_number;

-- 4) Vérifier les coordonnées de toutes les zones
SELECT 
    id,
    name,
    ST_XMin(geometry) as min_x,
    ST_XMax(geometry) as max_x,
    ST_YMin(geometry) as min_y,
    ST_YMax(geometry) as max_y,
    ST_Area(geometry) as area_m2
FROM zone
ORDER BY id;

-- 5) Script de correction si nécessaire (à adapter selon les résultats)
-- UPDATE zone SET 
--     geometry = ST_SetSRID(ST_GeomFromText('POLYGON((coords_correctes))'), 26191),
--     latitude = ST_Y(ST_Transform(ST_Centroid(ST_SetSRID(ST_GeomFromText('POLYGON((coords_correctes))'), 26191)), 4326)),
--     longitude = ST_X(ST_Transform(ST_Centroid(ST_SetSRID(ST_GeomFromText('POLYGON((coords_correctes))'), 26191)), 4326))
-- WHERE id = 'zone-piaj';