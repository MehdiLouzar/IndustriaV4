package com.industria.platform.entity;

/**
 * Énumération des statuts possibles pour une parcelle industrielle.
 * 
 * Définit le cycle de vie commercial d'une parcelle industrielle
 * de sa disponibilité à sa commercialisation finale.
 * 
 * @author Industria Platform Team
 * @version 1.0
 * @since 1.0
 */
public enum ParcelStatus {
    /** Parcelle disponible pour l'investissement */
    LIBRE,
    
    /** Parcelle réservée en cours de négociation */
    RESERVEE,
    
    /** Parcelle temporairement indisponible */
    INDISPONIBLE,
    
    /** Parcelle définitivement vendue */
    VENDU,
    
    /** Parcelle en cours de développement/construction */
    EN_DEVELOPPEMENT
}
