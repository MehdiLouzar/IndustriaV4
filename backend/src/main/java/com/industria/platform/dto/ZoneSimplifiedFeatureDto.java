package com.industria.platform.dto;

import java.util.List;

/**
 * DTO pour exposer des zones avec géométrie simplifiée.
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
