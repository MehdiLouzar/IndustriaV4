package com.industria.platform.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

/**
 * Entité représentant une notification envoyée.
 * 
 * Stocke l'historique des notifications emails envoyées aux utilisateurs
 * avec le suivi de leur statut (envoyé, échec, lu, etc.).
 * 
 * Utilisé pour l'audit des communications et les statistiques d'envoi.
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
public class Notification {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    private String recipientEmail;
    private String recipientName;
    private String subject;
    @Column(columnDefinition = "text")
    private String htmlBody;
    @Column(columnDefinition = "text")
    private String textBody;

    @Enumerated(EnumType.STRING)
    private NotificationStatus status;
    private LocalDateTime sentAt;
    private String failureReason;
    private Integer retryCount;
    private Integer maxRetries;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    @ManyToOne
    @JoinColumn(name = "template_id")
    private NotificationTemplate template;
}
