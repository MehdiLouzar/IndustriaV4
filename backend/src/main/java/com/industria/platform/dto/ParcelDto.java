package com.industria.platform.dto;

import java.util.List;

/**
 * DTO représentant une parcelle industrielle pour les échanges API.
 * 
 * Contient les informations d'une parcelle y compris ses contraintes
 * d'urbanisme et informations géospatiales.
 * 
 * @param id identifiant unique de la parcelle
 * @param reference référence unique de la parcelle
 * @param area superficie en m²
 * @param status statut actuel de la parcelle
 * @param isShowroom indique si c'est un showroom
 * @param zoneId identifiant de la zone parente
 * @param vertices points géométriques définissant la parcelle
 * @param longitude longitude du centre (WGS84)
 * @param latitude latitude du centre (WGS84)
 * @param cos coefficient d'occupation du sol
 * @param cus coefficient d'utilisation du sol
 * @param heightLimit limite de hauteur en mètres
 * @param setback recul obligatoire en mètres
 * @param zoneName nom de la zone parente
 * @param zoneAddress adresse de la zone parente
 * @param zonePrice prix de la zone parente
 * @param zonePriceType type de tarification de la zone parente
 * @param countryCurrency devise du pays pour l'affichage des prix
 * 
 * @author Industria Platform Team
 * @version 1.0
 * @since 1.0
 */
public record ParcelDto(String id, String reference, Double area,
                        String status, Boolean isShowroom, String zoneId, 
                        List<VertexDto> vertices, Double longitude, Double latitude,
                        Double cos, Double cus, Double heightLimit, Double setback,
                        String zoneName, String zoneAddress, Double zonePrice, String zonePriceType,
                        String countryCurrency) {}
