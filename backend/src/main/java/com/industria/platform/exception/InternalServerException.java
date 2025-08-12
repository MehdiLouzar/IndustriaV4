package com.industria.platform.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

/**
 * Exception levée lors d'erreurs internes du serveur.
 * 
 * Utilisée pour les erreurs techniques inattendues
 * et les pannes système.
 * Retourne automatiquement un statut HTTP 500 (Internal Server Error).
 * 
 * @author Industria Platform Team
 * @version 1.0
 * @since 1.0
 */
@ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
public class InternalServerException extends RuntimeException {
    public InternalServerException(String message) {
        super(message);
    }

    public InternalServerException(String message, Throwable cause) {
        super(message, cause);
    }
}