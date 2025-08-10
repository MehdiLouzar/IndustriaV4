package com.industria.platform.dto;

public record AppointmentDto(
    String id, 
    String contactName, 
    String contactEmail,
    String contactPhone, 
    String companyName, 
    String message,
    String activityType,
    String projectDescription,
    String investmentBudget,
    String preferredDate,
    String preferredTime,
    String urgency,
    String requestedDate, 
    String parcelId, 
    String status
) {}
