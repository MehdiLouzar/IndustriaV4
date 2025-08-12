package com.industria.platform.service;

import com.industria.platform.dto.VertexDto;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Service de calcul et conversion de coordonnées géospatiales.
 * 
 * Gère les conversions entre le système de projection Lambert Maroc
 * (EPSG:26191) et le système géodésique WGS84 (EPSG:4326).
 * 
 * IMPORTANT: Les formules de conversion utilisées sont approximatives
 * et devraient être remplacées par une bibliothèque spécialisée comme
 * GeoTools pour une précision cartographique maximale.
 * 
 * @author Industria Platform Team
 * @version 1.0
 * @since 1.0
 */
@Service
@Slf4j
public class CoordinateCalculationService {

    // Paramètres de projection Lambert II étendu (EPSG:27572) vers WGS84 (EPSG:4326)
    // Ces valeurs sont approximatives pour le Maroc - à ajuster selon le système exact utilisé
    private static final double CENTRAL_MERIDIAN = -5.0; // longitude centrale
    private static final double CENTRAL_PARALLEL = 33.3; // latitude centrale
    private static final double FALSE_EASTING = 500000.0;
    private static final double FALSE_NORTHING = 300000.0;
    private static final double SCALE_FACTOR = 0.9996;

    /**
     * Convertit les coordonnées Lambert Maroc vers WGS84.
     * 
     * Effectue une transformation approximative depuis le système de projection
     * Lambert Maroc vers les coordonnées géographiques WGS84.
     * 
     * ATTENTION: Cette conversion utilise des paramètres approximatifs.
     * Pour une précision cartographique, utiliser une bibliothèque
     * spécialisée comme GeoTools avec les paramètres EPSG officiels.
     * 
     * @param lambertX coordonnée X en Lambert Maroc (m)
     * @param lambertY coordonnée Y en Lambert Maroc (m)
     * @return tableau [longitude, latitude] en WGS84 (degrés)
     */
    public double[] lambertToWGS84(double lambertX, double lambertY) {
        // Transformation approximative - À remplacer par une vraie transformation de projection
        // Pour une conversion précise, utiliser une bibliothèque comme GeoTools
        
        double longitude = CENTRAL_MERIDIAN + (lambertX - FALSE_EASTING) / 111320.0;
        double latitude = CENTRAL_PARALLEL + (lambertY - FALSE_NORTHING) / 110540.0;
        
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
     * @param vertices liste des points du polygone en Lambert Maroc
     * @return tableau [X, Y] du centroïde en Lambert Maroc (m)
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
     * Calcule le centroïde d'un polygone et le convertit en WGS84.
     * 
     * Combine le calcul du centroïde en Lambert avec la conversion
     * automatique vers WGS84 pour l'affichage cartographique.
     * 
     * @param vertices liste des points du polygone en Lambert Maroc
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
     * Valide si des coordonnées Lambert sont dans les limites du Maroc.
     * 
     * Vérifie que les coordonnées se trouvent dans l'emprise
     * géographique approximative du territoire marocain.
     * 
     * @param x coordonnée X en Lambert Maroc (m)
     * @param y coordonnée Y en Lambert Maroc (m)
     * @return true si les coordonnées sont valides pour le Maroc
     */
    public boolean validateLambertCoordinates(double x, double y) {
        // Plages approximatives pour le Maroc en Lambert
        final double MIN_X = 200000.0;
        final double MAX_X = 800000.0;
        final double MIN_Y = 100000.0;
        final double MAX_Y = 600000.0;
        
        return x >= MIN_X && x <= MAX_X && y >= MIN_Y && y <= MAX_Y;
    }

    /**
     * Valide si des coordonnées WGS84 sont dans les limites du Maroc.
     * 
     * Vérifie que les coordonnées géographiques se trouvent dans
     * la boîte englobante du territoire marocain.
     * 
     * @param longitude longitude en WGS84 (degrés)
     * @param latitude latitude en WGS84 (degrés)
     * @return true si les coordonnées sont valides pour le Maroc
     */
    public boolean validateWGS84Coordinates(double longitude, double latitude) {
        // Plages approximatives pour le Maroc
        final double MIN_LONGITUDE = -13.0;  // Ouest du Maroc
        final double MAX_LONGITUDE = -1.0;   // Est du Maroc
        final double MIN_LATITUDE = 27.0;    // Sud du Maroc
        final double MAX_LATITUDE = 36.0;    // Nord du Maroc
        
        return longitude >= MIN_LONGITUDE && longitude <= MAX_LONGITUDE && 
               latitude >= MIN_LATITUDE && latitude <= MAX_LATITUDE;
    }
}