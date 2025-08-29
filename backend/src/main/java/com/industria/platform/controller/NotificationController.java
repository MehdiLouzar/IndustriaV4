package com.industria.platform.controller;

import com.industria.platform.dto.ListResponse;
import com.industria.platform.entity.Notification;
import com.industria.platform.entity.NotificationStatus;
import com.industria.platform.repository.NotificationRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Contrôleur REST pour la gestion des notifications.
 * 
 * Permet la consultation et gestion des notifications envoyées
 * par la plateforme avec filtrage et pagination.
 * 
 * Accès réservé aux administrateurs.
 * 
 * @author Industria Platform Team
 * @version 1.0
 * @since 1.0
 */
@RestController
@RequestMapping("/api/admin/notifications")
@PreAuthorize("hasRole('ADMIN')")
public class NotificationController {

    private final NotificationRepository notificationRepository;

    public NotificationController(NotificationRepository notificationRepository) {
        this.notificationRepository = notificationRepository;
    }

    @GetMapping
    public ListResponse<NotificationDto> getAllNotifications(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int limit,
            @RequestParam(required = false) NotificationStatus status) {
        
        int p = Math.max(1, page);
        int l = Math.min(Math.max(1, limit), 100);
        
        Pageable pageable = PageRequest.of(p - 1, l, Sort.by("createdAt").descending());
        
        var result = status != null 
            ? notificationRepository.findByStatus(status, pageable)
            : notificationRepository.findAll(pageable);
            
        var items = result.getContent().stream().map(this::toDto).toList();
        
        return new ListResponse<>(items, result.getTotalElements(), 
            result.getTotalPages(), p, l);
    }

    @GetMapping("/{id}")
    public ResponseEntity<NotificationDto> getNotification(@PathVariable String id) {
        return notificationRepository.findById(id)
                .map(notification -> ResponseEntity.ok(toDto(notification)))
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteNotification(@PathVariable String id) {
        return notificationRepository.findById(id)
                .map(notification -> {
                    notificationRepository.delete(notification);
                    return ResponseEntity.ok().<Void>build();
                })
                .orElse(ResponseEntity.notFound().build());
    }

    private NotificationDto toDto(Notification entity) {
        return new NotificationDto(
            entity.getId(),
            entity.getRecipientEmail(),
            entity.getRecipientName(),
            entity.getSubject(),
            entity.getStatus(),
            entity.getSentAt(),
            entity.getFailureReason(),
            entity.getRetryCount(),
            entity.getMaxRetries(),
            entity.getTemplate() != null ? entity.getTemplate().getId() : null,
            entity.getCreatedAt()
        );
    }

    public record NotificationDto(
        String id,
        String recipientEmail,
        String recipientName,
        String subject,
        NotificationStatus status,
        LocalDateTime sentAt,
        String failureReason,
        Integer retryCount,
        Integer maxRetries,
        String templateId,
        LocalDateTime createdAt
    ) {}
}