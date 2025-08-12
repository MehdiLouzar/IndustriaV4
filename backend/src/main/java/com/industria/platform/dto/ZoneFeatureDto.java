package com.industria.platform.dto;

import java.util.List;

/**
 * DTO représentant une zone au format GeoJSON Feature.
 * 
 * Contient les coordonnées géographiques et informations enrichies
 * d'une zone industrielle pour l'affichage cartographique détaillé.
 * 
 * @author Industria Platform Team
 * @version 1.0
 * @since 1.0
 */
public record ZoneFeatureDto(double[] coordinates, String id, String name, String status,
                             int availableParcels, List<String> activityIcons,
                             List<String> amenityIcons) {}
