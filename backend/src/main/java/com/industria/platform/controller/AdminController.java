package com.industria.platform.controller;

import com.industria.platform.entity.AuditLog;
import com.industria.platform.service.AuditService;
import com.industria.platform.service.PermissionService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.PrintWriter;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final PermissionService permissionService;
    private final AuditService auditService;

    public AdminController(PermissionService permissionService, 
                          AuditService auditService) {
        this.permissionService = permissionService;
        this.auditService = auditService;
    }

    /**
     * Vérifie si l'utilisateur peut accéder à l'administration
     */
    @GetMapping("/access")
    public ResponseEntity<Map<String, Object>> checkAdminAccess(Authentication authentication) {
        if (authentication == null || !permissionService.canAccessAdmin()) {
            return ResponseEntity.status(403).body(Map.of(
                "hasAccess", false,
                "message", "Accès refusé à l'interface d'administration"
            ));
        }

        return ResponseEntity.ok(Map.of(
            "hasAccess", true,
            "role", permissionService.getHighestRole(),
            "availableFunctions", List.of(
                "users", "countries", "regions", "zone-types", "activities", "amenities",
                "construction-types", "zones", "parcels", "appointments", 
                "contact-requests", "notifications", "audit-logs", "reports"
            ).stream()
             .filter(permissionService::canAccessAdminFunction)
             .toList()
        ));
    }

    /**
     * Retourne les fonctions admin disponibles selon le rôle
     */
    @GetMapping("/functions")
    public ResponseEntity<List<String>> getAvailableFunctions() {
        if (!permissionService.canAccessAdmin()) {
            return ResponseEntity.status(403).build();
        }

        List<String> functions = List.of(
            "users", "countries", "regions", "zone-types", "activities", "amenities",
            "construction-types", "zones", "parcels", "appointments", 
            "contact-requests", "notifications", "audit-logs", "reports"
        ).stream()
         .filter(permissionService::canAccessAdminFunction)
         .toList();

        return ResponseEntity.ok(functions);
    }

    /**
     * Vérifie l'accès à une fonction admin spécifique
     */
    @GetMapping("/functions/{function}")
    public ResponseEntity<Map<String, Boolean>> checkFunctionAccess(@PathVariable String function) {
        boolean hasAccess = permissionService.canAccessAdmin() && 
                           permissionService.canAccessAdminFunction(function);
        
        return ResponseEntity.ok(Map.of("hasAccess", hasAccess));
    }

    // === EXPORT FUNCTIONALITIES ===
    
    /**
     * Export des logs d'audit
     */
    @GetMapping("/audit-logs/export")
    @PreAuthorize("hasRole('ADMIN')")
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
            return exportAuditLogsToCsv(auditLogs);
        } else {
            throw new IllegalArgumentException("Format non supporté: " + format);
        }
    }
    
    
    // === PRIVATE HELPER METHODS ===
    
    private ResponseEntity<byte[]> exportAuditLogsToCsv(List<AuditLog> auditLogs) throws IOException {
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

}