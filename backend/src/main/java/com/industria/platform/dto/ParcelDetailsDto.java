package com.industria.platform.dto;

import java.util.List;

public record ParcelDetailsDto(String id, String reference, Double area, String status,
                               Boolean isShowroom, List<VertexDto> vertices,
                               Double latitude, Double longitude) {}
