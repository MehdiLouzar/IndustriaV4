package com.industria.platform.dto;

import java.util.List;

public record ZoneDto(String id,
                      String name,
                      String description,
                      String address,
                      Double totalArea,
                      Double price,
                      String priceType,
                      String status,
                      String regionId,
                      String zoneTypeId,
                      List<String> activityIds,
                      List<String> amenityIds,
                      List<VertexDto> vertices,
                      Double latitude,
                      Double longitude,
                      Integer totalParcels,
                      Integer availableParcels,
                      List<ParcelDto> parcels) {}
