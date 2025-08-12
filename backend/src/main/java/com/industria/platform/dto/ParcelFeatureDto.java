package com.industria.platform.dto;

/**
 * DTO représentant une parcelle au format GeoJSON Feature.
 * 
 * Contient les coordonnées géographiques et propriétés essentielles
 * d'une parcelle pour l'affichage cartographique.
 * 
 * @author Industria Platform Team
 * @version 1.0
 * @since 1.0
 */
public record ParcelFeatureDto(double[] coordinates, String id, String reference,
                               boolean isShowroom, String status) {}
