package com.industria.platform.controller;

import com.industria.platform.dto.ParcelFeatureDto;
import com.industria.platform.dto.ZoneFeatureDto;
import com.industria.platform.dto.ZoneSimplifiedFeatureDto;
import com.industria.platform.entity.Parcel;
import com.industria.platform.entity.ParcelStatus;
import com.industria.platform.entity.Zone;
import com.industria.platform.repository.ParcelRepository;
import com.industria.platform.repository.ZoneRepository;
import com.industria.platform.service.CoordinateCalculationService;
import org.locationtech.jts.geom.Coordinate;
import org.locationtech.jts.geom.Geometry;
import org.locationtech.jts.io.WKTReader;
import org.locationtech.jts.simplify.DouglasPeuckerSimplifier;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Contrôleur REST pour la gestion des cartes et des données géospatiales.
 * 
 * Fournit les données cartographiques optimisées pour l'affichage des zones
 * et parcelles avec conversion automatique de coordonnées et simplification géométrique.
 * 
 * @author Industria Platform Team
 * @version 1.0
 * @since 1.0
 */
@RestController
@RequestMapping("/api/map")
@RequiredArgsConstructor
@Slf4j
public class MapController {
    
    private final ZoneRepository zoneRepository;
    private final ParcelRepository parcelRepository;
    private final CoordinateCalculationService coordinateService;
    private final Map<Integer, List<ZoneSimplifiedFeatureDto>> simplifiedCache = new ConcurrentHashMap<>();

    /**
     * Récupère toutes les zones pour l'affichage sur la carte.
     *
     * @return réponse contenant les caractéristiques des zones
     */
    @GetMapping("/zones")
    public MapResponse<ZoneFeatureDto> zones() {
        List<ZoneFeatureDto> features = zoneRepository.findAll().stream().map(z ->
                new ZoneFeatureDto(parseCentroid(z.getGeometry()), z.getId(), z.getName(),
                        z.getStatus().name(),
                        parcelRepository.countByZoneIdAndStatus(z.getId(), ParcelStatus.LIBRE),
                        z.getActivities() == null ? List.of() : z.getActivities().stream().map(a -> a.getActivity().getIcon()).toList(),
                        z.getAmenities() == null ? List.of() : z.getAmenities().stream().map(a -> a.getAmenity().getIcon()).toList())
        ).toList();
        return new MapResponse<>(features);
    }

    /**
     * Récupère toutes les parcelles pour l'affichage sur la carte.
     *
     * @return réponse contenant les caractéristiques des parcelles
     */
    @GetMapping("/parcels")
    public MapResponse<ParcelFeatureDto> parcels() {
        List<ParcelFeatureDto> features = parcelRepository.findAll().stream().map(p ->
                new ParcelFeatureDto(parseCentroid(p.getGeometry()), p.getId(), p.getReference(),
                        Boolean.TRUE.equals(p.getIsShowroom()), p.getStatus().name())
        ).toList();
        return new MapResponse<>(features);
    }

    /**
     * Récupère le nombre total de zones et d'informations statistiques.
     *
     * @return carte contenant les statistiques des zones
     */
    @GetMapping("/zones/count")
    public Map<String, Object> getZoneCount() {
        List<Zone> zones = zoneRepository.findAll();
        long withCoords = zones.stream().filter(z -> z.getLatitude() != null && z.getLongitude() != null).count();
        return Map.of(
            "totalZones", zones.size(),
            "withCoordinates", withCoords,
            "sampleZone", zones.isEmpty() ? null : Map.of(
                "id", zones.get(0).getId(),
                "name", zones.get(0).getName(),
                "lat", zones.get(0).getLatitude(),
                "lon", zones.get(0).getLongitude()
            )
        );
    }
    
    /**
     * Récupère les zones simplifiées pour l'affichage optimisé sur la carte.
     *
     * @param zoom niveau de zoom pour déterminer le niveau de simplification
     * @return réponse contenant les caractéristiques simplifiées des zones
     */
    @GetMapping("/zones/simplified")
    public MapResponse<ZoneSimplifiedFeatureDto> simplifiedZones(@RequestParam(defaultValue = "6") int zoom) {
        // Get all zones and create simplified features
        List<Zone> zones = zoneRepository.findAll();
        
        List<ZoneSimplifiedFeatureDto> features = new ArrayList<>();
        
        for (Zone z : zones) {
            if (z.getLatitude() != null && z.getLongitude() != null) {
                // Create a small polygon around the center point
                double lat = z.getLatitude();
                double lon = z.getLongitude();
                double offset = 0.005; // ~500m
                
                List<double[]> coords = List.of(
                    new double[]{lat - offset, lon - offset},
                    new double[]{lat - offset, lon + offset},
                    new double[]{lat + offset, lon + offset},
                    new double[]{lat + offset, lon - offset},
                    new double[]{lat - offset, lon - offset}
                );
                
                try {
                    int availableParcels = parcelRepository.countByZoneIdAndStatus(z.getId(), ParcelStatus.LIBRE);
                    int totalParcels = parcelRepository.countByZoneId(z.getId());
                    
                    // Get activity icons
                    List<String> activityIcons = z.getActivities() != null ? 
                        z.getActivities().stream()
                            .map(za -> za.getActivity().getIcon())
                            .filter(Objects::nonNull)
                            .toList() : 
                        List.of();
                    
                    // Get amenity icons
                    List<String> amenityIcons = z.getAmenities() != null ? 
                        z.getAmenities().stream()
                            .map(za -> za.getAmenity().getIcon())
                            .filter(Objects::nonNull)
                            .toList() : 
                        List.of();
                    
                    // Format area
                    String formattedArea = z.getTotalArea() != null ? 
                        String.format("%.0f m²", z.getTotalArea()) : null;
                    
                    // Format price
                    String formattedPrice = z.getPrice() != null ? 
                        String.format("%.0f DH/m²", z.getPrice()) : null;
                    
                    // Get zone type
                    String zoneType = z.getZoneType() != null ? z.getZoneType().getName() : null;
                    
                    // Use address as location, fallback to region
                    String location = z.getAddress();
                    if ((location == null || location.trim().isEmpty()) && z.getRegion() != null) {
                        location = z.getRegion().getName();
                    }
                    
                    ZoneSimplifiedFeatureDto feature = new ZoneSimplifiedFeatureDto(
                        coords,
                        z.getId(),
                        z.getName(),
                        z.getStatus().name(),
                        availableParcels,
                        totalParcels,
                        activityIcons,
                        amenityIcons,
                        z.getDescription(),
                        location,
                        formattedArea,
                        formattedPrice,
                        zoneType
                    );
                    
                    features.add(feature);
                } catch (Exception e) {
                    log.warn("Skipping zone {} due to error: {}", z.getId(), e.getMessage());
                }
            }
        }
        
        return new MapResponse<>(features);
    }

    private List<ZoneSimplifiedFeatureDto> buildSimplifiedZones(int zoom) {
        log.info("Building simplified zones for zoom level {}", zoom);
        List<Zone> allZones = zoneRepository.findAll();
        log.info("Found {} zones in database", allZones.size());
        
        List<ZoneSimplifiedFeatureDto> result = new ArrayList<>();
        
        for (Zone z : allZones) {
            try {
                log.info("Processing zone {} - {}", z.getId(), z.getName());
                log.info("Zone has latitude={}, longitude={}", z.getLatitude(), z.getLongitude());
                
                // Utiliser les coordonnées WGS84 déjà calculées si disponibles
                List<double[]> coords = new ArrayList<>();
                
                if (z.getLatitude() != null && z.getLongitude() != null) {
                    // Créer un petit polygone autour du point central pour la visualisation
                    double lat = z.getLatitude();
                    double lon = z.getLongitude();
                    double offset = 0.005; // environ 500m
                    
                    // Coordonnées dans l'ordre [lat, lon] comme attendu par le frontend
                    coords.add(new double[]{lat - offset, lon - offset});
                    coords.add(new double[]{lat - offset, lon + offset});
                    coords.add(new double[]{lat + offset, lon + offset});
                    coords.add(new double[]{lat + offset, lon - offset});
                    coords.add(new double[]{lat - offset, lon - offset}); // fermer le polygone
                    
                    log.info("Using center coordinates for zone {}: {}, {}", z.getId(), lat, lon);
                } else {
                    log.info("No latitude/longitude for zone {}, trying WKT geometry", z.getId());
                    // Fallback: essayer de lire la géométrie WKT si elle existe
                    if (z.getGeometry() != null && !z.getGeometry().trim().isEmpty()) {
                        try {
                            WKTReader reader = new WKTReader();
                            Geometry geom = reader.read(z.getGeometry());
                            Geometry simplified = DouglasPeuckerSimplifier.simplify(geom, zoomToTolerance(zoom));
                            for (Coordinate c : simplified.getCoordinates()) {
                                double[] wgs = coordinateService.lambertToWGS84(c.getX(), c.getY());
                                coords.add(new double[]{wgs[1], wgs[0]}); // lat, lon
                            }
                            log.info("Using WKT geometry for zone {}", z.getId());
                        } catch (Exception e) {
                            log.error("Error reading WKT for zone {}: {}", z.getId(), e.getMessage());
                            continue; // Skip this zone
                        }
                    } else {
                        log.info("No geometry available for zone {}", z.getId());
                        continue; // Skip this zone
                    }
                }
                
                if (coords.isEmpty()) {
                    log.info("No coordinates generated for zone {}", z.getId());
                    continue; // Skip this zone
                }
                
                int availableParcels = parcelRepository.countByZoneIdAndStatus(z.getId(), ParcelStatus.LIBRE);
                int totalParcels = parcelRepository.countByZoneId(z.getId());
                
                // Get activity icons
                List<String> activityIcons = z.getActivities() != null ? 
                    z.getActivities().stream()
                        .map(za -> za.getActivity().getIcon())
                        .filter(Objects::nonNull)
                        .toList() : 
                    List.of();
                
                // Get amenity icons
                List<String> amenityIcons = z.getAmenities() != null ? 
                    z.getAmenities().stream()
                        .map(za -> za.getAmenity().getIcon())
                        .filter(Objects::nonNull)
                        .toList() : 
                    List.of();
                
                // Format area
                String formattedArea = z.getTotalArea() != null ? 
                    String.format("%.0f m²", z.getTotalArea()) : null;
                
                // Format price
                String formattedPrice = z.getPrice() != null ? 
                    String.format("%.0f DH/m²", z.getPrice()) : null;
                
                // Get zone type
                String zoneType = z.getZoneType() != null ? z.getZoneType().getName() : null;
                
                // Use address as location, fallback to region
                String location = z.getAddress();
                if ((location == null || location.trim().isEmpty()) && z.getRegion() != null) {
                    location = z.getRegion().getName();
                }
                
                ZoneSimplifiedFeatureDto feature = new ZoneSimplifiedFeatureDto(
                        coords,
                        z.getId(),
                        z.getName(),
                        z.getStatus().name(),
                        availableParcels,
                        totalParcels,
                        activityIcons,
                        amenityIcons,
                        z.getDescription(),
                        location,
                        formattedArea,
                        formattedPrice,
                        zoneType
                );
                
                result.add(feature);
                log.info("Successfully created feature for zone {} with {} coordinates", z.getId(), coords.size());
                
            } catch (Exception e) {
                log.error("Error processing zone {}: {}", z.getId(), e.getMessage(), e);
            }
        }
        
        log.info("Built {} zone features total", result.size());
        return result;
    }

    private double zoomToTolerance(int zoom) {
        if (zoom >= 15) return 5;
        if (zoom >= 12) return 20;
        if (zoom >= 10) return 50;
        if (zoom >= 8) return 100;
        return 200;
    }

    private double[] parseCentroid(String wkt) {
        if (wkt == null) return new double[]{0,0};
        String numbers = wkt.replaceAll("[^0-9.\\- ]", " ");
        String[] parts = numbers.trim().split(" +");
        double sumX=0,sumY=0; int count=0;
        for(int i=0;i+1<parts.length;i+=2){
            sumX+=Double.parseDouble(parts[i]);
            sumY+=Double.parseDouble(parts[i+1]);
            count++;}
        if(count==0) return new double[]{0,0};
        return new double[]{sumX/count,sumY/count};
    }

    public record MapResponse<T>(List<T> features) {}
}
