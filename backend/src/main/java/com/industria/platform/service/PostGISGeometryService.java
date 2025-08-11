package com.industria.platform.service;

import com.industria.platform.dto.VertexDto;
import com.industria.platform.entity.Parcel;
import com.industria.platform.entity.Zone;
import com.industria.platform.repository.ParcelRepository;
import com.industria.platform.repository.ZoneRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class PostGISGeometryService {

    private final ParcelRepository parcelRepository;
    private final ZoneRepository zoneRepository;
    private final GeometryParsingService geometryParsingService;

    public PostGISGeometryService(ParcelRepository parcelRepository,
                                 ZoneRepository zoneRepository,
                                 GeometryParsingService geometryParsingService) {
        this.parcelRepository = parcelRepository;
        this.zoneRepository = zoneRepository;
        this.geometryParsingService = geometryParsingService;
    }

    /**
     * Extrait les vertices d'une zone en convertissant WKB vers WKT avec JTS
     */
    public List<VertexDto> extractZoneVertices(String zoneId) {
        Optional<Zone> zoneOpt = zoneRepository.findById(zoneId);
        if (zoneOpt.isEmpty()) {
            return List.of();
        }
        
        Zone zone = zoneOpt.get();
        String geometry = zone.getGeometry();
        
        if (geometry == null || geometry.trim().isEmpty()) {
            return List.of();
        }
        
        // Convertir WKB vers WKT avec l'utilitaire JTS
        String wktGeometry = com.industria.platform.util.WKBToWKTUtil.convertWKBToWKT(geometry);
        
        if (wktGeometry == null) {
            return List.of();
        }
        
        // Parser la géométrie WKT transformée
        return geometryParsingService.parseWKTGeometry(wktGeometry);
    }

    /**
     * Extrait les vertices d'une parcelle en convertissant WKB vers WKT avec JTS
     */
    public List<VertexDto> extractParcelVertices(String parcelId) {
        Optional<Parcel> parcelOpt = parcelRepository.findById(parcelId);
        if (parcelOpt.isEmpty()) {
            return List.of();
        }
        
        Parcel parcel = parcelOpt.get();
        String geometry = parcel.getGeometry();
        
        if (geometry == null || geometry.trim().isEmpty()) {
            return List.of();
        }
        
        // Convertir WKB vers WKT avec l'utilitaire JTS
        String wktGeometry = com.industria.platform.util.WKBToWKTUtil.convertWKBToWKT(geometry);
        
        if (wktGeometry == null) {
            return List.of();
        }
        
        // Parser la géométrie WKT transformée
        return geometryParsingService.parseWKTGeometry(wktGeometry);
    }

    /**
     * Calcule le centroïde d'une zone
     */
    public double[] getZoneCentroid(String zoneId) {
        Optional<Zone> zoneOpt = zoneRepository.findById(zoneId);
        if (zoneOpt.isEmpty()) {
            return new double[]{0.0, 0.0, 0.0, 0.0};
        }
        
        Zone zone = zoneOpt.get();
        
        // Utiliser les coordonnées pré-calculées stockées dans l'entity
        double longitude = zone.getLongitude() != null ? zone.getLongitude() : 0.0;
        double latitude = zone.getLatitude() != null ? zone.getLatitude() : 0.0;
        
        // Pour les coordonnées Lambert, calculer le centroïde depuis les vertices
        List<VertexDto> vertices = extractZoneVertices(zoneId);
        double lambertX = 0.0, lambertY = 0.0;
        
        if (!vertices.isEmpty()) {
            for (VertexDto vertex : vertices) {
                lambertX += vertex.lambertX();
                lambertY += vertex.lambertY();
            }
            lambertX /= vertices.size();
            lambertY /= vertices.size();
        }
        
        return new double[]{longitude, latitude, lambertX, lambertY};
    }

    /**
     * Calcule le centroïde d'une parcelle 
     */
    public double[] getParcelCentroid(String parcelId) {
        Optional<Parcel> parcelOpt = parcelRepository.findById(parcelId);
        if (parcelOpt.isEmpty()) {
            return new double[]{0.0, 0.0, 0.0, 0.0};
        }
        
        Parcel parcel = parcelOpt.get();
        
        // Utiliser les coordonnées pré-calculées stockées dans l'entity
        double longitude = parcel.getLongitude() != null ? parcel.getLongitude() : 0.0;
        double latitude = parcel.getLatitude() != null ? parcel.getLatitude() : 0.0;
        
        // Pour les coordonnées Lambert, calculer le centroïde depuis les vertices
        List<VertexDto> vertices = extractParcelVertices(parcelId);
        double lambertX = 0.0, lambertY = 0.0;
        
        if (!vertices.isEmpty()) {
            for (VertexDto vertex : vertices) {
                lambertX += vertex.lambertX();
                lambertY += vertex.lambertY();
            }
            lambertX /= vertices.size();
            lambertY /= vertices.size();
        }
        
        return new double[]{longitude, latitude, lambertX, lambertY};
    }
    
    /**
     * Convertit WKB (format binaire) en WKT si nécessaire
     */
    private String convertToWKTIfNeeded(String geometry) {
        if (geometry == null || geometry.trim().isEmpty()) {
            return geometry;
        }
        
        // Si c'est déjà du WKT, retourner tel quel
        if (geometry.startsWith("POLYGON")) {
            return geometry;
        }
        
        // Si c'est du WKB (format hexadécimal commençant par 0103...), indiquer qu'on ne peut pas le convertir sans SQL
        if (geometry.matches("^[0-9A-Fa-f]+$")) {
            System.err.println("ERREUR: Géométrie en format WKB détectée, impossible de convertir sans requête SQL PostGIS");
            return null;
        }
        
        return geometry;
    }
}