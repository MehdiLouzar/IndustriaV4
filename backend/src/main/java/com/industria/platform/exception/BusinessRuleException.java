package com.industria.platform.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

/**
 * Exception levée lors de la violation de règles métier.
 * 
 * Utilisée pour signaler les erreurs de logique métier
 * comme les conflits de statut ou les opérations interdites.
 * Retourne un statut HTTP 409 (Conflict).
 * 
 * @author Industria Platform Team
 * @version 1.0
 * @since 1.0
 */
@ResponseStatus(HttpStatus.CONFLICT)
public class BusinessRuleException extends RuntimeException {
    public BusinessRuleException(String message) {
        super(message);
    }
}
