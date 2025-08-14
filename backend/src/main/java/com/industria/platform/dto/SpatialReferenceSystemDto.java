package com.industria.platform.dto;

import java.time.LocalDateTime;

/**
 * DTO pour les systèmes de référence spatiale.
 * 
 * Transfert de données pour les systèmes de coordonnées géographiques,
 * utilisé dans les API REST pour la création, modification et consultation.
 * 
 * @param id identifiant unique du système
 * @param name nom descriptif du système (ex: "WGS 84", "Lambert Maroc")
 * @param srid code EPSG du système (ex: 4326, 26191)
 * @param proj4text chaîne de projection Proj4
 * @param description description détaillée du système
 * @param createdAt date de création
 * @param updatedAt date de dernière modification
 * 
 * @author Industria Platform Team
 * @version 1.0
 * @since 1.0
 */
public record SpatialReferenceSystemDto(
    String id,
    String name,
    Integer srid,
    String proj4text,
    String description,
    LocalDateTime createdAt,
    LocalDateTime updatedAt
) {}