package com.industria.platform.dto;

import java.util.List;

public record ZoneDto(String id, String name, String description, Double totalArea,
                      Double price, String status, RegionDto region,
                      ZoneTypeDto zoneType, List<String> amenities) {}
