package com.industria.platform.controller;

import com.industria.platform.dto.ListResponse;
import com.industria.platform.entity.NotificationTemplate;
import com.industria.platform.entity.NotificationType;
import com.industria.platform.repository.NotificationTemplateRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;

/**
 * Contrôleur REST pour la gestion des modèles de notifications.
 * 
 * Permet la création, modification et gestion des templates d'emails
 * utilisés par la plateforme pour les communications automatiques.
 * 
 * Accès réservé aux administrateurs.
 * 
 * @author Industria Platform Team
 * @version 1.0
 * @since 1.0
 */
@RestController
@RequestMapping("/api/admin/notification-templates")
@PreAuthorize("hasRole('ADMIN')")
public class NotificationTemplateController {

    private final NotificationTemplateRepository templateRepository;

    public NotificationTemplateController(NotificationTemplateRepository templateRepository) {
        this.templateRepository = templateRepository;
    }

    @GetMapping
    public ListResponse<NotificationTemplateDto> getAllTemplates(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int limit,
            @RequestParam(required = false) NotificationType type) {
        
        int p = Math.max(1, page);
        int l = Math.min(Math.max(1, limit), 100);
        
        Pageable pageable = PageRequest.of(p - 1, l, Sort.by("createdAt").descending());
        
        var result = type != null 
            ? templateRepository.findByType(type, pageable)
            : templateRepository.findAll(pageable);
            
        var items = result.getContent().stream().map(this::toDto).toList();
        
        return new ListResponse<>(items, result.getTotalElements(), 
            result.getTotalPages(), p, l);
    }

    @GetMapping("/{id}")
    public ResponseEntity<NotificationTemplateDto> getTemplate(@PathVariable String id) {
        return templateRepository.findById(id)
                .map(template -> ResponseEntity.ok(toDto(template)))
                .orElse(ResponseEntity.notFound().build());
    }

    private NotificationTemplateDto toDto(NotificationTemplate entity) {
        return new NotificationTemplateDto(
            entity.getId(),
            entity.getType(),
            entity.getSubject(),
            entity.getHtmlBody(),
            entity.getTextBody(),
            entity.getCreatedAt()
        );
    }

    public record NotificationTemplateDto(
        String id,
        NotificationType type,
        String subject,
        String htmlBody,
        String textBody,
        LocalDateTime createdAt
    ) {}
}