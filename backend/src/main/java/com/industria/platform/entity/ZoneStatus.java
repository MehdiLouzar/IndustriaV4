package com.industria.platform.entity;

/**
 * Énumération des statuts possibles pour une zone industrielle.
 * 
 * Définit le cycle de vie commercial d'une zone industrielle
 * de sa création à sa commercialisation finale.
 * 
 * @author Industria Platform Team
 * @version 1.0
 * @since 1.0
 */
public enum ZoneStatus {
    /** Zone disponible pour l'investissement */
    LIBRE,
    
    /** Zone réservée en cours de négociation */
    RESERVEE,
    
    /** Zone temporairement indisponible */
    INDISPONIBLE,
    
    /** Zone définitivement vendue */
    VENDU,
    
    /** Zone en cours de développement/aménagement */
    EN_DEVELOPPEMENT
}
