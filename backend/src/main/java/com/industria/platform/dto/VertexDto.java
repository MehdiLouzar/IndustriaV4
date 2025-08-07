package com.industria.platform.dto;

public record VertexDto(int seq, double lambertX, double lambertY, Double latitude, Double longitude) {
    
    // Constructeur de compatibilité pour les cas où on n'a que les coordonnées Lambert
    public VertexDto(int seq, double lambertX, double lambertY) {
        this(seq, lambertX, lambertY, null, null);
    }
}
