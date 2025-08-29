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
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.PrintWriter;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

/**
 * Contrôleur REST pour la gestion des journaux d'audit.
 * Accessible uniquement aux administrateurs.
 * 
 * @author Industria Platform Team
 * @version 1.0
 * @since 1.0
 */
@RestController
@RequestMapping("/api/audit-logs")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AuditLogController {
    
    private final AuditService auditService;
    
    @GetMapping
    public ResponseEntity<Page<AuditLogDto>> getAuditLogs(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size,
            @RequestParam(required = false) String action,
            @RequestParam(required = false) String entity,
            @RequestParam(required = false) String userId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDateTime dateFrom,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDateTime dateTo,
            @RequestParam(required = false) String search) {
        
        Pageable pageable = PageRequest.of(page, size);
        Page<AuditLog> auditLogs = auditService.getFilteredAuditLogs(
            pageable, action, entity, userId, dateFrom, dateTo, search);
        
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
    
    @GetMapping("/export")
    public ResponseEntity<byte[]> exportAuditLogs(
            @RequestParam(defaultValue = "csv") String format,
            @RequestParam(required = false) String action,
            @RequestParam(required = false) String entity,
            @RequestParam(required = false) String userId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDateTime dateFrom,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDateTime dateTo,
            @RequestParam(required = false) String search) throws IOException {
        
        // Récupérer tous les logs avec filtres (sans pagination pour l'export)
        List<AuditLog> auditLogs = auditService.getAllFilteredAuditLogs(
            action, entity, userId, dateFrom, dateTo, search);
        
        if ("csv".equalsIgnoreCase(format)) {
            return exportToCsv(auditLogs);
        } else {
            throw new IllegalArgumentException("Format non supporté: " + format);
        }
    }
    
    private ResponseEntity<byte[]> exportToCsv(List<AuditLog> auditLogs) throws IOException {
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm:ss");
        
        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
        PrintWriter writer = new PrintWriter(outputStream);
        
        // En-têtes CSV
        writer.println("ID,Action,Entité,ID Entité,Utilisateur,Email,Date,Adresse IP,Description");
        
        // Données
        for (AuditLog log : auditLogs) {
            writer.printf("\"%s\",\"%s\",\"%s\",\"%s\",\"%s\",\"%s\",\"%s\",\"%s\",\"%s\"%n",
                escapeForCsv(log.getId()),
                escapeForCsv(log.getAction() != null ? log.getAction().name() : ""),
                escapeForCsv(log.getEntity() != null ? log.getEntity() : ""),
                escapeForCsv(log.getEntityId() != null ? log.getEntityId() : ""),
                escapeForCsv(log.getUser() != null && log.getUser().getName() != null ? log.getUser().getName() : "Système"),
                escapeForCsv(log.getUser() != null && log.getUser().getEmail() != null ? log.getUser().getEmail() : ""),
                escapeForCsv(log.getCreatedAt() != null ? log.getCreatedAt().format(formatter) : ""),
                escapeForCsv(log.getIpAddress() != null ? log.getIpAddress() : ""),
                escapeForCsv(log.getDescription() != null ? log.getDescription() : "")
            );
        }
        
        writer.flush();
        writer.close();
        
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType("text/csv"));
        headers.setContentDispositionFormData("attachment", 
            "audit_logs_" + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss")) + ".csv");
        
        return ResponseEntity.ok()
            .headers(headers)
            .body(outputStream.toByteArray());
    }
    
    private String escapeForCsv(String value) {
        if (value == null) {
            return "";
        }
        // Échapper les guillemets doubles en les doublant
        return value.replace("\"", "\"\"");
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