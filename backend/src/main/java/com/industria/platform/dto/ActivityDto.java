package com.industria.platform.dto;

/**
 * DTO représentant une activité industrielle.
 * 
 * Utilisé pour les types d'activités autorisées dans les zones.
 * 
 * @author Industria Platform Team
 * @version 1.0
 * @since 1.0
 */
public record ActivityDto(String id, String name, String description, String icon, String category) {}
