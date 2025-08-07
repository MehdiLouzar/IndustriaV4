package com.industria.platform.dto;

public record AppointmentDto(String id, String contactName, String contactEmail,
                             String contactPhone, String companyName, String message,
                             String requestedDate, String parcelId, String status) {}
