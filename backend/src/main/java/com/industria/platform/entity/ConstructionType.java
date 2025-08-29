package com.industria.platform.entity;

/**
 * Énumération des types de construction autorisés dans les zones.
 * 
 * Définit les différents modèles de développement immobilier
 * proposés aux investisseurs industriels.
 * 
 * @author Industria Platform Team
 * @version 1.0
 * @since 1.0
 */
public enum ConstructionType {
    /** Construction personnalisée selon les besoins */
    CUSTOM_BUILD,
    
    /** Construction par le propriétaire/investisseur */
    OWNER_BUILT,
    
    /** Location de terrain uniquement */
    LAND_LEASE_ONLY,
    
    /** Solution clé en main avec construction incluse */
    TURNKEY
}
