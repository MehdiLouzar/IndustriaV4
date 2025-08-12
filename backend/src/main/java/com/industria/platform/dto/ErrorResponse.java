package com.industria.platform.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.Map;

/**
 * DTO pour les réponses d'erreur API standardisées.
 * 
 * Structure uniforme pour toutes les erreurs HTTP retournées par l'API,
 * incluant les détails de validation et l'identifiant de traçabilité.
 * 
 * @author Industria Platform Team
 * @version 1.0
 * @since 1.0
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
@Builder
@Getter
public class ErrorResponse {
    private final String timestamp;
    private final int status;
    private final String error;
    private final String message;
    private final String path;
    private final Map<String, String> validationErrors;
    private final String traceId;

}
