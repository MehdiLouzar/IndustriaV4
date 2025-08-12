package com.industria.platform.dto;

import java.util.List;

/**
 * DTO représentant une zone avec géométrie simplifiée et données complètes.
 * 
 * Version optimisée pour l'affichage cartographique avec géométrie simplifiée
 * pour de meilleures performances de rendu tout en conservant les informations détaillées.
 * 
 * @author Industria Platform Team
 * @version 1.0
 * @since 1.0
 */
public record ZoneSimplifiedFeatureDto(
        List<double[]> coordinates,
        String id,
        String name,
        String status,
        int availableParcels,
        Integer totalParcels,
        List<String> activityIcons,
        List<String> amenityIcons,
        String description,
        String location,
        String area,
        String price,
        String type
) {}
