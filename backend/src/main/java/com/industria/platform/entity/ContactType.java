package com.industria.platform.entity;

/**
 * Énumération des types de demandeurs de contact.
 * 
 * Distingue les profils de demandeurs pour personnaliser
 * les formulaires et processus de traitement.
 * 
 * @author Industria Platform Team
 * @version 1.0
 * @since 1.0
 */
public enum ContactType {
    AMENAGEUR("Aménageur"),
    INDUSTRIEL_INVESTISSEUR("Industriel/Investisseur");

    private final String displayName;

    ContactType(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}