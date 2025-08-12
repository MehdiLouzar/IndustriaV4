package com.industria.platform.dto;

import java.util.List;

/**
 * DTO représentant une zone industrielle pour les échanges API.
 * 
 * Contient toutes les informations d'une zone y compris ses coordonnées
 * géospatiales, activités autorisées et parcelles associées.
 * 
 * @param id identifiant unique de la zone
 * @param name nom de la zone
 * @param description description détaillée
 * @param address adresse physique
 * @param totalArea superficie totale en m²
 * @param price prix de base
 * @param priceType type de tarification
 * @param constructionType type de construction autorisé
 * @param status statut actuel de la zone
 * @param regionId identifiant de la région
 * @param zoneTypeId identifiant du type de zone
 * @param activityIds liste des identifiants d'activités autorisées
 * @param amenityIds liste des identifiants d'équipements disponibles
 * @param vertices points géométriques définissant la zone
 * @param latitude latitude du centre (WGS84)
 * @param longitude longitude du centre (WGS84)
 * @param totalParcels nombre total de parcelles
 * @param availableParcels nombre de parcelles disponibles
 * @param parcels liste des parcelles de la zone
 * 
 * @author Industria Platform Team
 * @version 1.0
 * @since 1.0
 */
public record ZoneDto(String id,
                      String name,
                      String description,
                      String address,
                      Double totalArea,
                      Double price,
                      String priceType,
                      String constructionType,
                      String status,
                      String regionId,
                      String zoneTypeId,
                      List<String> activityIds,
                      List<String> amenityIds,
                      List<VertexDto> vertices,
                      Double latitude,
                      Double longitude,
                      Integer totalParcels,
                      Integer availableParcels,
                      List<ParcelDto> parcels) {}
