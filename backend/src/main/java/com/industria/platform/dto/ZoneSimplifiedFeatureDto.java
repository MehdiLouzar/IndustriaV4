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
        List<String> activityIcons,
        List<String> amenityIcons
) {}
