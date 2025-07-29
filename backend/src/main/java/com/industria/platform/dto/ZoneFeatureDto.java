package com.industria.platform.dto;

import java.util.List;

public record ZoneFeatureDto(double[] coordinates, String id, String name, String status,
                             int availableParcels, List<String> activityIcons,
                             List<String> amenityIcons) {}
