package com.industria.platform.entity;

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