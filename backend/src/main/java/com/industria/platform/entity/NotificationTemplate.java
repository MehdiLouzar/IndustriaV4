package com.industria.platform.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.Set;

/**
 * Entité représentant un modèle de notification.
 * 
 * Stocke les templates d'emails réutilisables avec support de variables
 * pour personnaliser le contenu selon le contexte.
 * 
 * Permet la gestion centralisée des communications email
 * avec versioning et traductions potentielles.
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
public class NotificationTemplate {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Enumerated(EnumType.STRING)
    private NotificationType type;
    private String subject;
    @Column(columnDefinition = "text")
    private String htmlBody;
    @Column(columnDefinition = "text")
    private String textBody;
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

    @OneToMany(mappedBy = "template")
    private Set<Notification> notifications;
}
