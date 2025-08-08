package com.industria.platform.controller;

import com.industria.platform.dto.AuditLogDto;
import com.industria.platform.entity.AuditAction;
import com.industria.platform.entity.AuditLog;
import com.industria.platform.service.AuditService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/audit-logs")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AuditLogController {
    
    private final AuditService auditService;
    
    @GetMapping
    public ResponseEntity<Page<AuditLogDto>> getAuditLogs(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        
        Pageable pageable = PageRequest.of(page, size);
        Page<AuditLog> auditLogs = auditService.getAllAuditLogs(pageable);
        
        Page<AuditLogDto> auditLogDtos = auditLogs.map(this::convertToDto);
        
        return ResponseEntity.ok(auditLogDtos);
    }
    
    @GetMapping("/entity/{entity}")
    public ResponseEntity<List<AuditLogDto>> getAuditLogsByEntity(
            @PathVariable String entity,
            @RequestParam(required = false) String entityId) {
        
        List<AuditLog> auditLogs;
        if (entityId != null) {
            auditLogs = auditService.getAuditLogsByEntity(entity, entityId);
        } else {
            // Si entityId n'est pas fourni, on récupère tous les logs pour cette entité
            auditLogs = auditService.getAuditLogsByEntity(entity, null);
        }
        
        List<AuditLogDto> auditLogDtos = auditLogs.stream()
                .map(this::convertToDto)
                .toList();
        
        return ResponseEntity.ok(auditLogDtos);
    }
    
    @GetMapping("/action/{action}")
    public ResponseEntity<List<AuditLogDto>> getAuditLogsByAction(@PathVariable AuditAction action) {
        List<AuditLog> auditLogs = auditService.getAuditLogsByAction(action);
        
        List<AuditLogDto> auditLogDtos = auditLogs.stream()
                .map(this::convertToDto)
                .toList();
        
        return ResponseEntity.ok(auditLogDtos);
    }
    
    @GetMapping("/date-range")
    public ResponseEntity<List<AuditLogDto>> getAuditLogsByDateRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate) {
        
        List<AuditLog> auditLogs = auditService.getAuditLogsByDateRange(startDate, endDate);
        
        List<AuditLogDto> auditLogDtos = auditLogs.stream()
                .map(this::convertToDto)
                .toList();
        
        return ResponseEntity.ok(auditLogDtos);
    }
    
    private AuditLogDto convertToDto(AuditLog auditLog) {
        return AuditLogDto.builder()
                .id(auditLog.getId())
                .action(auditLog.getAction())
                .entity(auditLog.getEntity())
                .entityId(auditLog.getEntityId())
                .oldValues(auditLog.getOldValues())
                .newValues(auditLog.getNewValues())
                .description(auditLog.getDescription())
                .userId(auditLog.getUser() != null ? auditLog.getUser().getId() : null)
                .userEmail(auditLog.getUser() != null ? auditLog.getUser().getEmail() : null)
                .createdAt(auditLog.getCreatedAt())
                .ipAddress(auditLog.getIpAddress())
                .userAgent(auditLog.getUserAgent())
                .build();
    }
}