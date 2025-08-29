package com.industria.platform.exception;

import lombok.Getter;

import java.util.Map;

/**
 * Exception levée lors d'erreurs de validation de données.
 * 
 * Contient une map détaillée des erreurs par champ pour permettre
 * un affichage précis des messages d'erreur côté client.
 * 
 * @author Industria Platform Team
 * @version 1.0
 * @since 1.0
 */
@Getter
public class ValidationException extends RuntimeException {
    private final Map<String, String> errors;

    public ValidationException(String message, Map<String, String> errors) {
        super(message);
        this.errors = errors;
    }

    public ValidationException(String field, String message) {
        super(message);
        this.errors = Map.of(field, message);
    }

}