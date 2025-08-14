package com.industria.platform.dto;

/**
 * DTO représentant un pays avec ses informations géographiques.
 * 
 * Utilisé pour les référentiels géographiques avec support des
 * systèmes de coordonnées et monnaies.
 * 
 * @author Industria Platform Team
 * @version 2.0
 * @since 1.0
 */
public record CountryDto(
    String id, 
    String name, 
    String code,
    String currency,
    Integer defaultSrid,
    String spatialReferenceSystemName
) {
    
    // Constructeur simple pour compatibilité
    public CountryDto(String id, String name, String code) {
        this(id, name, code, null, null, null);
    }
}
