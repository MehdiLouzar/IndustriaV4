package com.industria.platform.service;

import com.industria.platform.dto.VertexDto;
import com.industria.platform.entity.Zone;
import com.industria.platform.entity.Parcel;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Service de calcul et conversion de coordonnées géospatiales.
 * 
 * Gère les conversions entre différents systèmes de projection Lambert
 * et le système géodésique WGS84 (EPSG:4326) pour n'importe quel pays.
 * 
 * IMPORTANT: Les formules de conversion utilisées sont approximatives
 * et devraient être remplacées par une bibliothèque spécialisée comme
 * GeoTools pour une précision cartographique maximale.
 * 
 * @author Industria Platform Team
 * @version 2.0
 * @since 1.0
 */
@Service
@Slf4j
public class CoordinateCalculationService {

    /**
     * Paramètres de projection configurables selon le pays/région
     */
    public static class ProjectionParams {
        public final double centralMeridian;
        public final double centralParallel;
        public final double falseEasting;
        public final double falseNorthing;
        public final double scaleFactor;
        public final double minLongitude;
        public final double maxLongitude;
        public final double minLatitude;
        public final double maxLatitude;
        public final double minX;
        public final double maxX;
        public final double minY;
        public final double maxY;
        
        public ProjectionParams(double centralMeridian, double centralParallel,
                           double falseEasting, double falseNorthing, double scaleFactor,
                           double minLon, double maxLon, double minLat, double maxLat,
                           double minX, double maxX, double minY, double maxY) {
            this.centralMeridian = centralMeridian;
            this.centralParallel = centralParallel;
            this.falseEasting = falseEasting;
            this.falseNorthing = falseNorthing;
            this.scaleFactor = scaleFactor;
            this.minLongitude = minLon;
            this.maxLongitude = maxLon;
            this.minLatitude = minLat;
            this.maxLatitude = maxLat;
            this.minX = minX;
            this.maxX = maxX;
            this.minY = minY;
            this.maxY = maxY;
        }
    }
    
    // Paramètres par défaut pour le Maroc (compatibilité)
    private static final ProjectionParams MOROCCO_PARAMS = new ProjectionParams(
        -5.0, 33.3, 500000.0, 300000.0, 0.9996,  // Projection Lambert
        -13.0, -1.0, 27.0, 36.0,                 // Limites WGS84
        200000.0, 800000.0, 100000.0, 600000.0   // Limites Lambert
    );
    
    // Paramètres pour la France
    private static final ProjectionParams FRANCE_PARAMS = new ProjectionParams(
        3.0, 46.5, 700000.0, 6600000.0, 0.9996,  // Projection Lambert 93
        -5.0, 10.0, 41.0, 51.5,                  // Limites WGS84
        75000.0, 1275000.0, 6000000.0, 7200000.0 // Limites Lambert
    );
    
    // Paramètres pour l'Algérie
    private static final ProjectionParams ALGERIA_PARAMS = new ProjectionParams(
        3.0, 28.5, 500000.0, 300000.0, 0.9996,   // Projection Lambert
        -8.7, 12.0, 19.0, 37.0,                  // Limites WGS84
        150000.0, 850000.0, 50000.0, 750000.0    // Limites Lambert
    );
    
    // Paramètres par défaut (Maroc)
    private ProjectionParams currentParams = MOROCCO_PARAMS;

    /**
     * Configure les paramètres de projection pour un pays spécifique.
     * 
     * @param country code du pays ("morocco", "france", "algeria")
     */
    public void setCountryParameters(String country) {
        switch (country.toLowerCase()) {
            case "morocco":
            case "maroc":
                currentParams = MOROCCO_PARAMS;
                break;
            case "france":
                currentParams = FRANCE_PARAMS;
                break;
            case "algeria":
            case "algerie":
                currentParams = ALGERIA_PARAMS;
                break;
            default:
                log.warn("Paramètres non définis pour le pays: {}. Utilisation des paramètres du Maroc.", country);
                currentParams = MOROCCO_PARAMS;
        }
        log.info("Paramètres de projection configurés pour: {}", country);
    }
    
    /**
     * Configure des paramètres de projection personnalisés.
     * 
     * @param params paramètres de projection personnalisés
     */
    public void setCustomParameters(ProjectionParams params) {
        this.currentParams = params;
        log.info("Paramètres de projection personnalisés configurés");
    }
    
    /**
     * Configure automatiquement les paramètres selon le pays d'une zone.
     * 
     * @param zone zone pour laquelle configurer les paramètres
     */
    public void configureForZone(Zone zone) {
        if (zone != null && zone.getRegion() != null && zone.getRegion().getCountry() != null) {
            String countryCode = zone.getRegion().getCountry().getCode();
            if (countryCode != null) {
                setCountryParameters(countryCode.toLowerCase());
            }
        }
    }
    
    /**
     * Configure automatiquement les paramètres selon le pays d'une parcelle.
     * 
     * @param parcel parcelle pour laquelle configurer les paramètres
     */
    public void configureForParcel(Parcel parcel) {
        if (parcel != null && parcel.getZone() != null) {
            configureForZone(parcel.getZone());
        }
    }
    
    /**
     * Convertit les coordonnées Lambert vers WGS84.
     * 
     * Effectue une transformation approximative depuis le système de projection
     * Lambert vers les coordonnées géographiques WGS84 selon le pays configuré.
     * 
     * ATTENTION: Cette conversion utilise des paramètres approximatifs.
     * Pour une précision cartographique, utiliser une bibliothèque
     * spécialisée comme GeoTools avec les paramètres EPSG officiels.
     * 
     * @param lambertX coordonnée X en Lambert (m)
     * @param lambertY coordonnée Y en Lambert (m)
     * @return tableau [longitude, latitude] en WGS84 (degrés)
     */
    public double[] lambertToWGS84(double lambertX, double lambertY) {
        // Transformation approximative - À remplacer par une vraie transformation de projection
        // Pour une conversion précise, utiliser une bibliothèque comme GeoTools
        
        double longitude = currentParams.centralMeridian + (lambertX - currentParams.falseEasting) / 111320.0;
        double latitude = currentParams.centralParallel + (lambertY - currentParams.falseNorthing) / 110540.0;
        
        log.debug("Lambert({}, {}) -> WGS84({}, {})", lambertX, lambertY, longitude, latitude);
        
        return new double[]{
            Math.round(longitude * 1000000.0) / 1000000.0, // 6 décimales
            Math.round(latitude * 1000000.0) / 1000000.0   // 6 décimales
        };
    }

    /**
     * Calcule le centroïde d'un polygone en coordonnées Lambert.
     * 
     * Utilise la moyenne arithmétique des vertices pour déterminer
     * le point central du polygone.
     * 
     * @param vertices liste des points du polygone en Lambert
     * @return tableau [X, Y] du centroïde en Lambert (m)
     */
    public double[] calculateCentroidLambert(List<VertexDto> vertices) {
        if (vertices == null || vertices.isEmpty()) {
            return new double[]{0.0, 0.0};
        }
        
        double sumX = vertices.stream().mapToDouble(VertexDto::lambertX).sum();
        double sumY = vertices.stream().mapToDouble(VertexDto::lambertY).sum();
        
        return new double[]{
            sumX / vertices.size(),
            sumY / vertices.size()
        };
    }

    /**
     * Convertit les coordonnées Lambert vers WGS84 pour une zone spécifique.
     * Configure automatiquement les paramètres selon le pays de la zone.
     * 
     * @param lambertX coordonnée X en Lambert (m)
     * @param lambertY coordonnée Y en Lambert (m)
     * @param zone zone pour la configuration des paramètres
     * @return tableau [longitude, latitude] en WGS84 (degrés)
     */
    public double[] lambertToWGS84ForZone(double lambertX, double lambertY, Zone zone) {
        configureForZone(zone);
        return lambertToWGS84(lambertX, lambertY);
    }
    
    /**
     * Convertit les coordonnées Lambert vers WGS84 pour une parcelle spécifique.
     * Configure automatiquement les paramètres selon le pays de la parcelle.
     * 
     * @param lambertX coordonnée X en Lambert (m)
     * @param lambertY coordonnée Y en Lambert (m)
     * @param parcel parcelle pour la configuration des paramètres
     * @return tableau [longitude, latitude] en WGS84 (degrés)
     */
    public double[] lambertToWGS84ForParcel(double lambertX, double lambertY, Parcel parcel) {
        configureForParcel(parcel);
        return lambertToWGS84(lambertX, lambertY);
    }
    
    /**
     * Calcule le centroïde d'un polygone et le convertit en WGS84.
     * 
     * Combine le calcul du centroïde en Lambert avec la conversion
     * automatique vers WGS84 pour l'affichage cartographique.
     * 
     * @param vertices liste des points du polygone en Lambert
     * @return tableau [longitude, latitude] du centroïde en WGS84 (degrés)
     */
    public double[] calculateCentroidWGS84(List<VertexDto> vertices) {
        if (vertices == null || vertices.isEmpty()) {
            return new double[]{0.0, 0.0};
        }
        
        double[] centroidLambert = calculateCentroidLambert(vertices);
        return lambertToWGS84(centroidLambert[0], centroidLambert[1]);
    }
    
    /**
     * Calcule le centroïde d'un polygone pour une zone spécifique.
     * Configure automatiquement les paramètres selon le pays de la zone.
     * 
     * @param vertices liste des points du polygone en Lambert
     * @param zone zone pour la configuration des paramètres
     * @return tableau [longitude, latitude] du centroïde en WGS84 (degrés)
     */
    public double[] calculateCentroidWGS84ForZone(List<VertexDto> vertices, Zone zone) {
        if (vertices == null || vertices.isEmpty()) {
            return new double[]{0.0, 0.0};
        }
        
        configureForZone(zone);
        double[] centroidLambert = calculateCentroidLambert(vertices);
        return lambertToWGS84(centroidLambert[0], centroidLambert[1]);
    }
    
    /**
     * Calcule le centroïde d'un polygone pour une parcelle spécifique.
     * Configure automatiquement les paramètres selon le pays de la parcelle.
     * 
     * @param vertices liste des points du polygone en Lambert
     * @param parcel parcelle pour la configuration des paramètres
     * @return tableau [longitude, latitude] du centroïde en WGS84 (degrés)
     */
    public double[] calculateCentroidWGS84ForParcel(List<VertexDto> vertices, Parcel parcel) {
        if (vertices == null || vertices.isEmpty()) {
            return new double[]{0.0, 0.0};
        }
        
        configureForParcel(parcel);
        double[] centroidLambert = calculateCentroidLambert(vertices);
        return lambertToWGS84(centroidLambert[0], centroidLambert[1]);
    }

    /**
     * Valide si des coordonnées Lambert sont dans les limites du pays configuré.
     * 
     * Vérifie que les coordonnées se trouvent dans l'emprise
     * géographique du territoire configuré.
     * 
     * @param x coordonnée X en Lambert (m)
     * @param y coordonnée Y en Lambert (m)
     * @return true si les coordonnées sont valides pour le pays configuré
     */
    public boolean validateLambertCoordinates(double x, double y) {
        return x >= currentParams.minX && x <= currentParams.maxX && 
               y >= currentParams.minY && y <= currentParams.maxY;
    }

    /**
     * Valide si des coordonnées WGS84 sont dans les limites du pays configuré.
     * 
     * Vérifie que les coordonnées géographiques se trouvent dans
     * la boîte englobante du territoire configuré.
     * 
     * @param longitude longitude en WGS84 (degrés)
     * @param latitude latitude en WGS84 (degrés)
     * @return true si les coordonnées sont valides pour le pays configuré
     */
    public boolean validateWGS84Coordinates(double longitude, double latitude) {
        return longitude >= currentParams.minLongitude && longitude <= currentParams.maxLongitude && 
               latitude >= currentParams.minLatitude && latitude <= currentParams.maxLatitude;
    }
    
    /**
     * Retourne les paramètres de projection actuels.
     * 
     * @return paramètres de projection configurés
     */
    public ProjectionParams getCurrentParameters() {
        return currentParams;
    }
}