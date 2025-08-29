package com.industria.platform.dto;

import com.industria.platform.entity.AuditAction;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * DTO représentant un log d'audit pour les échanges API.
 * 
 * Contient toutes les informations de traçabilité d'une action
 * utilisateur avec métadonnées contextuelles.
 * 
 * @author Industria Platform Team
 * @version 1.0
 * @since 1.0
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuditLogDto {
    private String id;
    private AuditAction action;
    private String entity;
    private String entityId;
    private String oldValues;
    private String newValues;
    private String description;
    private String userId;
    private String userEmail;
    private LocalDateTime createdAt;
    private String ipAddress;
    private String userAgent;
}