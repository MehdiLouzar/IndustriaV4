package com.industria.platform.entity;

/**
 * Énumération des statuts possibles pour un rendez-vous.
 * 
 * Définit le cycle de vie d'une demande de rendez-vous
 * depuis sa soumission jusqu'à sa réalisation ou annulation.
 * 
 * @author Industria Platform Team
 * @version 1.0
 * @since 1.0
 */
public enum AppointmentStatus {
    /** Rendez-vous en attente de traitement */
    PENDING,
    
    /** Rendez-vous confirmé par le gestionnaire */
    CONFIRMED,
    
    /** Rendez-vous terminé avec succès */
    COMPLETED,
    
    /** Rendez-vous annulé */
    CANCELLED,
    
    /** Rendez-vous reporté à une nouvelle date */
    RESCHEDULED
}
