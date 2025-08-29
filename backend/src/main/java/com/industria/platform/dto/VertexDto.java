package com.industria.platform.dto;

/**
 * DTO représentant un point géographique avec coordonnées multiples.
 * 
 * Combine les coordonnées Lambert (système local Maroc) et WGS84
 * pour l'affichage cartographique et les calculs géospatiaux.
 * 
 * @param seq numéro de séquence du point dans le polygone
 * @param lambertX coordonnée X en projection Lambert Maroc
 * @param lambertY coordonnée Y en projection Lambert Maroc  
 * @param latitude latitude en WGS84 (optionnelle)
 * @param longitude longitude en WGS84 (optionnelle)
 * 
 * @author Industria Platform Team
 * @version 1.0
 * @since 1.0
 */
public record VertexDto(int seq, double lambertX, double lambertY, Double latitude, Double longitude) {
    
    // Constructeur de compatibilité pour les cas où on n'a que les coordonnées Lambert
    public VertexDto(int seq, double lambertX, double lambertY) {
        this(seq, lambertX, lambertY, null, null);
    }
}
