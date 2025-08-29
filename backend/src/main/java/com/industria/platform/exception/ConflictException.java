package com.industria.platform.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

/**
 * Exception levée lors de conflits de données.
 * 
 * Utilisée pour les violations de contraintes d'unicité
 * ou les conflits d'état lors des opérations.
 * Retourne automatiquement un statut HTTP 409 (Conflict).
 * 
 * @author Industria Platform Team
 * @version 1.0
 * @since 1.0
 */
@ResponseStatus(HttpStatus.CONFLICT)
public class ConflictException extends RuntimeException {
    public ConflictException(String message) {
        super(message);
    }
}
