package com.industria.platform.service;

import com.industria.platform.dto.VertexDto;
import com.industria.platform.entity.Zone;
import com.industria.platform.entity.Parcel;
import com.industria.platform.entity.Country;
import com.industria.platform.entity.SpatialReferenceSystem;
import com.industria.platform.repository.SpatialReferenceSystemRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Service de calcul et conversion de coordonnées géospatiales.
 * 
 * Utilise les systèmes de référence spatiale configurés en base de données
 * pour effectuer les conversions vers WGS84 (EPSG:4326) pour n'importe quel pays.
 * 
 * @author Industria Platform Team
 * @version 3.0 - Utilise les données dynamiques de la DB
 * @since 1.0
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class CoordinateCalculationService {
    
    private final SpatialReferenceSystemRepository spatialReferenceSystemRepository;


    

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
     * Convertit les coordonnées locales vers WGS84 pour une zone spécifique.
     * Utilise le SRID configuré dans la base de données pour le pays de la zone.
     * 
     * @param x coordonnée X dans le système local (m)
     * @param y coordonnée Y dans le système local (m)
     * @param zone zone pour déterminer le système de coordonnées
     * @return tableau [longitude, latitude] en WGS84 (degrés)
     */
    public double[] lambertToWGS84ForZone(double x, double y, Zone zone) {
        if (zone == null || zone.getRegion() == null || zone.getRegion().getCountry() == null) {
            log.warn("Impossible de déterminer le pays pour la zone, utilisation des coordonnées brutes");
            return new double[]{x, y}; // Fallback
        }
        
        Country country = zone.getRegion().getCountry();
        Integer srid = country.getDefaultSrid();
        
        if (srid == null) {
            log.warn("Aucun SRID configuré pour le pays {}, utilisation des coordonnées brutes", country.getCode());
            return new double[]{x, y}; // Fallback
        }
        
        return convertCoordinatesUsingSRID(x, y, srid);
    }
    
    /**
     * Convertit les coordonnées locales vers WGS84 pour une parcelle spécifique.
     * Utilise le SRID configuré dans la base de données pour le pays de la parcelle.
     * 
     * @param x coordonnée X dans le système local (m)  
     * @param y coordonnée Y dans le système local (m)
     * @param parcel parcelle pour déterminer le système de coordonnées
     * @return tableau [longitude, latitude] en WGS84 (degrés)
     */
    public double[] lambertToWGS84ForParcel(double x, double y, Parcel parcel) {
        if (parcel != null && parcel.getZone() != null) {
            return lambertToWGS84ForZone(x, y, parcel.getZone());
        }
        
        log.warn("Impossible de déterminer le pays pour la parcelle, utilisation des coordonnées brutes");
        return new double[]{x, y}; // Fallback
    }
    
    /**
     * Convertit les coordonnées d'un SRID donné vers WGS84.
     * 
     * @param x coordonnée X dans le système source
     * @param y coordonnée Y dans le système source  
     * @param sourceSrid SRID du système source
     * @return tableau [longitude, latitude] en WGS84 (degrés)
     */
    private double[] convertCoordinatesUsingSRID(double x, double y, Integer sourceSrid) {
        if (sourceSrid == null) {
            log.warn("SRID source null, impossible de convertir");
            return new double[]{x, y}; // Fallback
        }
        
        // Si le SRID source est déjà WGS84, pas de conversion nécessaire
        if (sourceSrid == 4326) {
            log.debug("Coordonnées déjà en WGS84, aucune conversion nécessaire");
            return new double[]{x, y}; // x=longitude, y=latitude
        }
        
        // Récupérer les informations du système de référence spatiale depuis la DB
        SpatialReferenceSystem srs = spatialReferenceSystemRepository.findBySrid(sourceSrid);
        if (srs == null) {
            log.warn("Système de référence spatiale introuvable pour SRID {}, utilisation approximative", sourceSrid);
            return convertUsingApproximation(x, y, sourceSrid);
        }
        
        log.debug("Conversion {} -> WGS84 pour le système {}", sourceSrid, srs.getName());
        
        // Pour l'instant, utilisation d'approximations basées sur le SRID
        // TODO: Intégrer une vraie bibliothèque de projection comme GeoTools
        return convertUsingApproximation(x, y, sourceSrid);
    }
    
    /**
     * Méthode de conversion approximative basée sur les SRID connus.
     * Cette méthode sera remplacée par une vraie bibliothèque de projection.
     */
    private double[] convertUsingApproximation(double x, double y, Integer srid) {
        switch (srid) {
            case 26191: // Lambert Conformal Conic Morocco
                return convertMoroccoLambertToWGS84(x, y);
            case 2154: // RGF93 / Lambert-93 (France)
                return convertFranceLambert93ToWGS84(x, y);  
            case 31491: // UTM Zone 31N Algeria
                return convertAlgeriaUTMToWGS84(x, y);
            default:
                log.warn("Conversion non supportée pour SRID {}, utilisation des coordonnées brutes", srid);
                return new double[]{x, y};
        }
    }
    
    /**
     * Conversion approximative Lambert Maroc -> WGS84
     */
    private double[] convertMoroccoLambertToWGS84(double x, double y) {
        // Paramètres approximatifs pour le Maroc (EPSG:26191)
        double centralMeridian = -5.4;
        double centralParallel = 33.3;
        double falseEasting = 500000.0;
        double falseNorthing = 300000.0;
        double scaleFactor = 0.999625769;
        
        double adjustedX = (x - falseEasting) / scaleFactor;
        double adjustedY = (y - falseNorthing) / scaleFactor;
        
        double longitude = centralMeridian + (adjustedX / 111320.0);
        double latitude = centralParallel + (adjustedY / 110540.0);
        
        return new double[]{longitude, latitude};
    }
    
    /**
     * Conversion approximative Lambert 93 France -> WGS84
     */
    private double[] convertFranceLambert93ToWGS84(double x, double y) {
        // Paramètres approximatifs pour la France (EPSG:2154)
        double centralMeridian = 3.0;
        double centralParallel = 46.5;
        double falseEasting = 700000.0;
        double falseNorthing = 6600000.0;
        double scaleFactor = 0.9999;
        
        double adjustedX = (x - falseEasting) / scaleFactor;
        double adjustedY = (y - falseNorthing) / scaleFactor;
        
        double longitude = centralMeridian + (adjustedX / 111320.0);
        double latitude = centralParallel + (adjustedY / 110540.0);
        
        return new double[]{longitude, latitude};
    }
    
    /**
     * Conversion approximative UTM Zone 31N Algérie -> WGS84  
     */
    private double[] convertAlgeriaUTMToWGS84(double x, double y) {
        // Paramètres approximatifs pour l'Algérie UTM Zone 31N (EPSG:31491)
        double centralMeridian = 3.0; // Zone UTM 31N
        double falseEasting = 500000.0;
        double falseNorthing = 0.0;
        double scaleFactor = 0.9996;
        
        double adjustedX = (x - falseEasting) / scaleFactor;
        double adjustedY = (y - falseNorthing) / scaleFactor;
        
        double longitude = centralMeridian + (adjustedX / 111320.0);
        double latitude = adjustedY / 110540.0;
        
        return new double[]{longitude, latitude};
    }
    
    /**
     * Calcule le centroïde d'un polygone pour une zone spécifique.
     * Utilise le système de coordonnées approprié selon le pays de la zone.
     * 
     * @param vertices liste des points du polygone en coordonnées locales
     * @param zone zone pour déterminer le système de coordonnées
     * @return tableau [longitude, latitude] du centroïde en WGS84 (degrés)
     */
    public double[] calculateCentroidWGS84ForZone(List<VertexDto> vertices, Zone zone) {
        if (vertices == null || vertices.isEmpty()) {
            return new double[]{0.0, 0.0};
        }
        
        double[] centroidLambert = calculateCentroidLambert(vertices);
        return lambertToWGS84ForZone(centroidLambert[0], centroidLambert[1], zone);
    }
    
    /**
     * Calcule le centroïde d'un polygone pour une parcelle spécifique.
     * Utilise le système de coordonnées approprié selon le pays de la parcelle.
     * 
     * @param vertices liste des points du polygone en coordonnées locales
     * @param parcel parcelle pour déterminer le système de coordonnées
     * @return tableau [longitude, latitude] du centroïde en WGS84 (degrés)
     */
    public double[] calculateCentroidWGS84ForParcel(List<VertexDto> vertices, Parcel parcel) {
        if (vertices == null || vertices.isEmpty()) {
            return new double[]{0.0, 0.0};
        }
        
        double[] centroidLambert = calculateCentroidLambert(vertices);
        return lambertToWGS84ForParcel(centroidLambert[0], centroidLambert[1], parcel);
    }

    
}