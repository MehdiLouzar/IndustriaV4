package com.industria.platform.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

/**
 * Exception levée lors d'accès non autorisés.
 * 
 * Utilisée lorsqu'un utilisateur tente d'accéder à une ressource
 * sans authentification valide.
 * Retourne automatiquement un statut HTTP 401 (Unauthorized).
 * 
 * @author Industria Platform Team
 * @version 1.0
 * @since 1.0
 */
@ResponseStatus(HttpStatus.UNAUTHORIZED)
public class UnauthorizedException extends RuntimeException {
    public UnauthorizedException(String message) {
        super(message);
    }

    public UnauthorizedException() {
        super("Authentication required");
    }
}
