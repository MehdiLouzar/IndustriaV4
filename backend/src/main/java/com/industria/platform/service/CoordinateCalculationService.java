package com.industria.platform.service;

import com.industria.platform.dto.VertexDto;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class CoordinateCalculationService {

    // Paramètres de projection Lambert II étendu (EPSG:27572) vers WGS84 (EPSG:4326)
    // Ces valeurs sont approximatives pour le Maroc - à ajuster selon le système exact utilisé
    private static final double CENTRAL_MERIDIAN = -5.0; // longitude centrale
    private static final double CENTRAL_PARALLEL = 33.3; // latitude centrale
    private static final double FALSE_EASTING = 500000.0;
    private static final double FALSE_NORTHING = 300000.0;
    private static final double SCALE_FACTOR = 0.9996;

    /**
     * Convertit les coordonnées Lambert vers WGS84 (longitude/latitude)
     * ATTENTION: Cette conversion est approximative et doit être ajustée selon le système exact utilisé au Maroc
     */
    public double[] lambertToWGS84(double lambertX, double lambertY) {
        // Transformation approximative - À remplacer par une vraie transformation de projection
        // Pour une conversion précise, utiliser une bibliothèque comme GeoTools
        
        double longitude = CENTRAL_MERIDIAN + (lambertX - FALSE_EASTING) / 111320.0;
        double latitude = CENTRAL_PARALLEL + (lambertY - FALSE_NORTHING) / 110540.0;
        
        System.out.println("DEBUG: Lambert(" + lambertX + ", " + lambertY + ") -> WGS84(" + longitude + ", " + latitude + ")");
        
        return new double[]{
            Math.round(longitude * 1000000.0) / 1000000.0, // 6 décimales
            Math.round(latitude * 1000000.0) / 1000000.0   // 6 décimales
        };
    }

    /**
     * Calcule le centre (centroïde) d'un polygone en coordonnées Lambert
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
     * Calcule le centre d'un polygone et le convertit en WGS84
     */
    public double[] calculateCentroidWGS84(List<VertexDto> vertices) {
        if (vertices == null || vertices.isEmpty()) {
            return new double[]{0.0, 0.0};
        }
        
        double[] centroidLambert = calculateCentroidLambert(vertices);
        return lambertToWGS84(centroidLambert[0], centroidLambert[1]);
    }

    /**
     * Valide si des coordonnées Lambert sont dans une plage raisonnable pour le Maroc
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
     * Valide si des coordonnées WGS84 sont dans une plage raisonnable pour le Maroc
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