package com.industria.platform.dto;

/**
 * DTO représentant une feature géographique générique.
 * 
 * Utilisé pour l'échange de données cartographiques avec coordonnées
 * et métadonnées basiques.
 * 
 * @author Industria Platform Team
 * @version 1.0
 * @since 1.0
 */
public record GeoFeature(double[] coordinates, String id, String name, String status) {}
