package com.industria.platform.entity;

/**
 * Énumération des rôles utilisateur dans la plateforme.
 * 
 * Définit la hiérarchie des permissions et autorisations
 * pour l'accès aux fonctionnalités de l'application.
 * 
 * @author Industria Platform Team
 * @version 1.0
 * @since 1.0
 */
public enum UserRole {
    /** Utilisateur standard avec accès en lecture seule */
    USER,
    
    /** Gestionnaire de zones avec gestion de ses zones/parcelles */
    ZONE_MANAGER,
    
    /** Gestionnaire de contenu avec droits éditoriaux */
    CONTENT_MANAGER,
    
    /** Administrateur avec accès complet à toutes les fonctionnalités */
    ADMIN
}
