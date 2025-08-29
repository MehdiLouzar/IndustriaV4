package com.industria.platform.entity;

/**
 * Énumération des statuts de demandes de contact.
 * 
 * Cycle de vie d'une demande de contact depuis sa soumission
 * jusqu'à sa résolution finale.
 * 
 * @author Industria Platform Team
 * @version 1.0
 * @since 1.0
 */
public enum ContactRequestStatus {
    NOUVEAU("Nouveau"),
    EN_COURS("En cours"),
    TRAITE("Traité"),
    FERME("Fermé");

    private final String displayName;

    ContactRequestStatus(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}