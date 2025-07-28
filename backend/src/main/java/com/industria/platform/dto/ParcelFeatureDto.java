package com.industria.platform.dto;

public record ParcelFeatureDto(double[] coordinates, String id, String reference,
                               boolean isShowroom, String status) {}
