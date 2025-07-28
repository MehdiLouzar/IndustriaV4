package com.industria.platform.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.Set;

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

    @OneToMany(mappedBy = "template")
    private Set<Notification> notifications;
}
