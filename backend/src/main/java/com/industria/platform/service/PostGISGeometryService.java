package com.industria.platform.service;

import com.industria.platform.dto.VertexDto;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.ArrayList;

@Service
public class PostGISGeometryService {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    /**
     * Extrait les vertices d'une zone directement depuis PostGIS
     * Retourne les coordonnées Lambert correctes (EPSG:26191)
     */
    public List<VertexDto> extractZoneVertices(String zoneId) {
        String sql = """
            SELECT 
                (ST_DumpPoints(geometry)).path[1] as seq,
                ST_X((ST_DumpPoints(geometry)).geom) as lambert_x,
                ST_Y((ST_DumpPoints(geometry)).geom) as lambert_y,
                ST_X(ST_Transform((ST_DumpPoints(geometry)).geom, 4326)) as longitude,
                ST_Y(ST_Transform((ST_DumpPoints(geometry)).geom, 4326)) as latitude
            FROM zone 
            WHERE id = ?
            AND geometry IS NOT NULL
            ORDER BY seq
            """;

        List<Map<String, Object>> results = jdbcTemplate.queryForList(sql, zoneId);
        List<VertexDto> vertices = new ArrayList<>();

        for (Map<String, Object> row : results) {
            // Éviter les doublons (premier et dernier point identiques dans les polygones)
            int seq = ((Number) row.get("seq")).intValue();
            double lambertX = ((Number) row.get("lambert_x")).doubleValue();
            double lambertY = ((Number) row.get("lambert_y")).doubleValue();
            Double longitude = row.get("longitude") != null ? ((Number) row.get("longitude")).doubleValue() : null;
            Double latitude = row.get("latitude") != null ? ((Number) row.get("latitude")).doubleValue() : null;

            // Ne pas inclure le dernier point s'il est identique au premier (fermeture du polygone)
            if (seq == results.size() && vertices.size() > 0) {
                VertexDto first = vertices.get(0);
                if (Math.abs(lambertX - first.lambertX()) < 0.01 && 
                    Math.abs(lambertY - first.lambertY()) < 0.01) {
                    continue; // Skip le point de fermeture
                }
            }

            vertices.add(new VertexDto(seq, lambertX, lambertY, latitude, longitude));
        }

        return vertices;
    }

    /**
     * Extrait les vertices d'une parcelle directement depuis PostGIS
     */
    public List<VertexDto> extractParcelVertices(String parcelId) {
        String sql = """
            SELECT 
                (ST_DumpPoints(geometry)).path[1] as seq,
                ST_X((ST_DumpPoints(geometry)).geom) as lambert_x,
                ST_Y((ST_DumpPoints(geometry)).geom) as lambert_y,
                ST_X(ST_Transform((ST_DumpPoints(geometry)).geom, 4326)) as longitude,
                ST_Y(ST_Transform((ST_DumpPoints(geometry)).geom, 4326)) as latitude
            FROM parcel 
            WHERE id = ?
            AND geometry IS NOT NULL
            ORDER BY seq
            """;

        List<Map<String, Object>> results = jdbcTemplate.queryForList(sql, parcelId);
        List<VertexDto> vertices = new ArrayList<>();

        for (Map<String, Object> row : results) {
            int seq = ((Number) row.get("seq")).intValue();
            double lambertX = ((Number) row.get("lambert_x")).doubleValue();
            double lambertY = ((Number) row.get("lambert_y")).doubleValue();
            Double longitude = row.get("longitude") != null ? ((Number) row.get("longitude")).doubleValue() : null;
            Double latitude = row.get("latitude") != null ? ((Number) row.get("latitude")).doubleValue() : null;

            // Ne pas inclure le point de fermeture
            if (seq == results.size() && vertices.size() > 0) {
                VertexDto first = vertices.get(0);
                if (Math.abs(lambertX - first.lambertX()) < 0.01 && 
                    Math.abs(lambertY - first.lambertY()) < 0.01) {
                    continue;
                }
            }

            vertices.add(new VertexDto(seq, lambertX, lambertY, latitude, longitude));
        }

        return vertices;
    }

    /**
     * Calcule le centroïde d'une zone directement depuis PostGIS
     */
    public double[] getZoneCentroid(String zoneId) {
        String sql = """
            SELECT 
                ST_X(ST_Transform(ST_Centroid(geometry), 4326)) as longitude,
                ST_Y(ST_Transform(ST_Centroid(geometry), 4326)) as latitude,
                ST_X(ST_Centroid(geometry)) as lambert_x,
                ST_Y(ST_Centroid(geometry)) as lambert_y
            FROM zone 
            WHERE id = ? AND geometry IS NOT NULL
            """;

        Map<String, Object> result = jdbcTemplate.queryForMap(sql, zoneId);
        
        return new double[]{
            ((Number) result.get("longitude")).doubleValue(),
            ((Number) result.get("latitude")).doubleValue(),
            ((Number) result.get("lambert_x")).doubleValue(),
            ((Number) result.get("lambert_y")).doubleValue()
        };
    }

    /**
     * Calcule le centroïde d'une parcelle directement depuis PostGIS
     */
    public double[] getParcelCentroid(String parcelId) {
        String sql = """
            SELECT 
                ST_X(ST_Transform(ST_Centroid(geometry), 4326)) as longitude,
                ST_Y(ST_Transform(ST_Centroid(geometry), 4326)) as latitude,
                ST_X(ST_Centroid(geometry)) as lambert_x,
                ST_Y(ST_Centroid(geometry)) as lambert_y
            FROM parcel 
            WHERE id = ? AND geometry IS NOT NULL
            """;

        Map<String, Object> result = jdbcTemplate.queryForMap(sql, parcelId);
        
        return new double[]{
            ((Number) result.get("longitude")).doubleValue(),
            ((Number) result.get("latitude")).doubleValue(),
            ((Number) result.get("lambert_x")).doubleValue(),
            ((Number) result.get("lambert_y")).doubleValue()
        };
    }
}