package com.industria.platform.dto;

/**
 * DTO représentant un rendez-vous d'investisseur.
 * 
 * Contient les informations de demande de rendez-vous
 * pour la visite d'une parcelle industrielle.
 * 
 * @author Industria Platform Team
 * @version 1.0
 * @since 1.0
 */
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
