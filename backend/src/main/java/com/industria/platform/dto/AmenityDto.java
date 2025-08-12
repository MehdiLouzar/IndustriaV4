package com.industria.platform.dto;

/**
 * DTO représentant un équipement ou service.
 * 
 * Utilisé pour les équipements disponibles dans les zones industrielles.
 * 
 * @author Industria Platform Team
 * @version 1.0
 * @since 1.0
 */
public record AmenityDto(String id, String name, String description, String icon, String category) {}
