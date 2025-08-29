package com.industria.platform.dto;

/**
 * DTO représentant une région.
 * 
 * Utilisé pour les référentiels géographiques du Maroc.
 * 
 * @author Industria Platform Team
 * @version 1.0
 * @since 1.0
 */
public record RegionDto(String id, String name, String code, String countryId) {}
