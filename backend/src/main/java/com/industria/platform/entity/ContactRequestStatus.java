package com.industria.platform.entity;

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