package com.industria.platform.dto;

import java.util.List;

public record ParcelDto(String id, String reference, Double area,
                        String status, Boolean isShowroom, String zoneId, 
                        List<VertexDto> vertices, Double longitude, Double latitude) {}
