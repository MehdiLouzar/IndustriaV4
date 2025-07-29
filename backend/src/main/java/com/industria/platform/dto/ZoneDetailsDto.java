package com.industria.platform.dto;

import java.util.List;

public record ZoneDetailsDto(String id, String name, String description,
                             Double totalArea, Double price, String status,
                             RegionDto region, ZoneTypeDto zoneType,
                             List<String> amenities, List<String> activities,
                             Double latitude, Double longitude,
                             List<VertexDto> vertices, List<ParcelDetailsDto> parcels) {}
