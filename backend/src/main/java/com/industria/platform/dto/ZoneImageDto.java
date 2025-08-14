package com.industria.platform.dto;

/**
 * DTO représentant une image de zone pour les échanges API.
 * 
 * @param id identifiant unique de l'image
 * @param filename nom du fichier sur le serveur
 * @param originalFilename nom original du fichier uploadé
 * @param contentType type MIME de l'image
 * @param fileSize taille du fichier en octets
 * @param description description de l'image
 * @param displayOrder ordre d'affichage
 * @param isPrimary indique si c'est l'image principale
 * @param url URL pour accéder à l'image
 * 
 * @author Industria Platform Team
 * @version 1.0
 * @since 1.0
 */
public record ZoneImageDto(String id,
                          String filename,
                          String originalFilename,
                          String contentType,
                          Long fileSize,
                          String description,
                          Integer displayOrder,
                          Boolean isPrimary,
                          String url) {}