package com.industria.platform.dto;

public record ParcelDto(String id, String reference, Double area,
                        String status, Boolean isShowroom, String zoneId) {}
