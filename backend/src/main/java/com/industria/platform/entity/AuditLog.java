package com.industria.platform.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

/**
 * Entité représentant un log d'audit système.
 * 
 * Chaque enregistrement trace une action effectuée par un utilisateur
 * avec les métadonnées contextuelles (IP, User-Agent, timestamp).
 * 
 * Permet la conformité réglementaire et le suivi des modifications
 * pour des besoins de sécurité et de traçabilité.
 * 
 * @author Industria Platform Team
 * @version 1.0
 * @since 1.0
 */
@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuditLog {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Enumerated(EnumType.STRING)
    private AuditAction action;
    private String entity;
    private String entityId;
    @Column(columnDefinition = "text")
    private String oldValues;
    @Column(columnDefinition = "text")
    private String newValues;
    private String description;
    private String ipAddress;
    private String userAgent;
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;
}
