package com.industria.platform.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

/**
 * Exception levée pour les requêtes malformées.
 * 
 * Utilisée lorsque les paramètres ou données de la requête
 * ne respectent pas le format attendu.
 * Retourne automatiquement un statut HTTP 400 (Bad Request).
 * 
 * @author Industria Platform Team
 * @version 1.0
 * @since 1.0
 */
@ResponseStatus(HttpStatus.BAD_REQUEST)
public class BadRequestException extends RuntimeException {
    public BadRequestException(String message) {
        super(message);
    }
}