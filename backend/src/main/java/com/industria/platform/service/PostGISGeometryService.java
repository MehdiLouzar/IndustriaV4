package com.industria.platform.service;

import com.industria.platform.dto.VertexDto;
import com.industria.platform.entity.Parcel;
import com.industria.platform.entity.Zone;
import com.industria.platform.repository.ParcelRepository;
import com.industria.platform.repository.ZoneRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

/**
 * Service d'extraction et manipulation de géométries PostGIS.
 * 
 * Gère la conversion des formats géométriques (WKB/WKT) et l'extraction
 * des vertices pour les zones et parcelles stockées en base PostGIS.
 * 
 * @author Industria Platform Team
 * @version 1.0
 * @since 1.0
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class PostGISGeometryService {

    private final ParcelRepository parcelRepository;
    private final ZoneRepository zoneRepository;
    private final GeometryParsingService geometryParsingService;
    private final CoordinateCalculationService coordinateCalculationService;

    /**
     * Extrait les vertices géométriques d'une zone.
     * 
     * Convertit automatiquement les formats WKB vers WKT si nécessaire
     * et extrait les points de contour de la zone.
     * 
     * @param zoneId identifiant de la zone
     * @return liste des vertices en coordonnées Lambert Maroc
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
     * Extrait les vertices géométriques d'une parcelle.
     * 
     * Convertit automatiquement les formats WKB vers WKT si nécessaire
     * et extrait les points de contour de la parcelle.
     * 
     * @param parcelId identifiant de la parcelle
     * @return liste des vertices en coordonnées Lambert Maroc
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
     * Calcule le centroïde d'une zone dans plusieurs systèmes de coordonnées.
     * Configure automatiquement les paramètres de projection selon le pays de la zone.
     * 
     * Retourne les coordonnées du centre géométrique en WGS84 (pré-calculées
     * ou calculées dynamiquement) et en Lambert (calculées dynamiquement).
     * 
     * @param zoneId identifiant de la zone
     * @return tableau [longitude_WGS84, latitude_WGS84, X_Lambert, Y_Lambert]
     */
    public double[] getZoneCentroid(String zoneId) {
        Optional<Zone> zoneOpt = zoneRepository.findById(zoneId);
        if (zoneOpt.isEmpty()) {
            return new double[]{0.0, 0.0, 0.0, 0.0};
        }
        
        Zone zone = zoneOpt.get();
        
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
            
            // Utiliser le service de conversion avec configuration automatique du pays
            double[] wgs84 = coordinateCalculationService.lambertToWGS84ForZone(lambertX, lambertY, zone);
            return new double[]{wgs84[0], wgs84[1], lambertX, lambertY};
        }
        
        // Fallback: utiliser les coordonnées pré-calculées si disponibles
        double longitude = zone.getLongitude() != null ? zone.getLongitude() : 0.0;
        double latitude = zone.getLatitude() != null ? zone.getLatitude() : 0.0;
        
        return new double[]{longitude, latitude, lambertX, lambertY};
    }

    /**
     * Calcule le centroïde d'une parcelle dans plusieurs systèmes de coordonnées.
     * Configure automatiquement les paramètres de projection selon le pays de la parcelle.
     * 
     * Retourne les coordonnées du centre géométrique en WGS84 (pré-calculées
     * ou calculées dynamiquement) et en Lambert (calculées dynamiquement).
     * 
     * @param parcelId identifiant de la parcelle
     * @return tableau [longitude_WGS84, latitude_WGS84, X_Lambert, Y_Lambert]
     */
    public double[] getParcelCentroid(String parcelId) {
        Optional<Parcel> parcelOpt = parcelRepository.findById(parcelId);
        if (parcelOpt.isEmpty()) {
            return new double[]{0.0, 0.0, 0.0, 0.0};
        }
        
        Parcel parcel = parcelOpt.get();
        
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
            
            // Utiliser le service de conversion avec configuration automatique du pays
            double[] wgs84 = coordinateCalculationService.lambertToWGS84ForParcel(lambertX, lambertY, parcel);
            return new double[]{wgs84[0], wgs84[1], lambertX, lambertY};
        }
        
        // Fallback: utiliser les coordonnées pré-calculées si disponibles
        double longitude = parcel.getLongitude() != null ? parcel.getLongitude() : 0.0;
        double latitude = parcel.getLatitude() != null ? parcel.getLatitude() : 0.0;
        
        return new double[]{longitude, latitude, lambertX, lambertY};
    }
    
    /**
     * Convertit une géométrie WKB vers WKT si nécessaire.
     * 
     * Détecte automatiquement le format de la géométrie et effectue
     * la conversion appropriee pour le parsing.
     * 
     * @param geometry géométrie en format WKB ou WKT
     * @return géométrie convertie en WKT ou null si conversion impossible
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
            log.error("Géométrie en format WKB détectée, impossible de convertir sans requête SQL PostGIS");
            return null;
        }
        
        return geometry;
    }
}