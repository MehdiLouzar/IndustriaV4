package com.industria.platform.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

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

    @ManyToOne
    @JoinColumn(name = "template_id")
    private NotificationTemplate template;
}
