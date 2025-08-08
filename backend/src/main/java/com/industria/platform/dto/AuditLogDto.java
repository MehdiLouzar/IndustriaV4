package com.industria.platform.dto;

import com.industria.platform.entity.AuditAction;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

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