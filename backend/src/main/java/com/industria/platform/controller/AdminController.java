package com.industria.platform.controller;

import com.industria.platform.entity.AuditLog;
import com.industria.platform.service.AuditService;
import com.industria.platform.service.PermissionService;
import com.industria.platform.service.ReportService;
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
    private final ReportService reportService;

    public AdminController(PermissionService permissionService, 
                          AuditService auditService, 
                          ReportService reportService) {
        this.permissionService = permissionService;
        this.auditService = auditService;
        this.reportService = reportService;
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
    
    /**
     * Statistiques pour les rapports
     */
    @GetMapping("/reports/stats")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> getReportStats(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDateTime from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDateTime to) {
        
        Map<String, Object> stats = reportService.getReportStats(from, to);
        return ResponseEntity.ok(stats);
    }
    
    /**
     * Export des rapports
     */
    @GetMapping("/reports/export")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<byte[]> exportReports(
            @RequestParam(defaultValue = "csv") String format,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDateTime from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDateTime to) throws IOException {
        
        Map<String, Object> reportData = reportService.getDetailedReportData(from, to);
        
        if ("csv".equalsIgnoreCase(format)) {
            return exportReportsToCsv(reportData);
        } else if ("excel".equalsIgnoreCase(format)) {
            return exportReportsToExcel(reportData);
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
    
    private ResponseEntity<byte[]> exportReportsToCsv(Map<String, Object> reportData) throws IOException {
        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
        PrintWriter writer = new PrintWriter(outputStream);
        
        // Statistiques générales
        writer.println("=== RAPPORT GÉNÉRAL ===");
        writer.println("Zones totales," + reportData.get("totalZones"));
        writer.println("Parcelles totales," + reportData.get("totalParcels"));
        writer.println("Parcelles disponibles," + reportData.get("availableParcels"));
        writer.println("Utilisateurs totaux," + reportData.get("totalUsers"));
        writer.println("RDV totaux," + reportData.get("totalAppointments"));
        writer.println("RDV en attente," + reportData.get("pendingAppointments"));
        writer.println();
        
        // Zones par statut
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> zonesByStatus = (List<Map<String, Object>>) reportData.get("zonesByStatus");
        if (zonesByStatus != null) {
            writer.println("=== ZONES PAR STATUT ===");
            writer.println("Statut,Nombre");
            for (Map<String, Object> item : zonesByStatus) {
                writer.printf("\"%s\",%s%n", 
                    escapeForCsv(String.valueOf(item.get("status"))),
                    item.get("count"));
            }
            writer.println();
        }
        
        // Parcelles par statut
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> parcelsByStatus = (List<Map<String, Object>>) reportData.get("parcelsByStatus");
        if (parcelsByStatus != null) {
            writer.println("=== PARCELLES PAR STATUT ===");
            writer.println("Statut,Nombre");
            for (Map<String, Object> item : parcelsByStatus) {
                writer.printf("\"%s\",%s%n", 
                    escapeForCsv(String.valueOf(item.get("status"))),
                    item.get("count"));
            }
            writer.println();
        }
        
        // RDV par statut
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> appointmentsByStatus = (List<Map<String, Object>>) reportData.get("appointmentsByStatus");
        if (appointmentsByStatus != null) {
            writer.println("=== RENDEZ-VOUS PAR STATUT ===");
            writer.println("Statut,Nombre");
            for (Map<String, Object> item : appointmentsByStatus) {
                writer.printf("\"%s\",%s%n", 
                    escapeForCsv(String.valueOf(item.get("status"))),
                    item.get("count"));
            }
            writer.println();
        }
        
        // Top régions
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> topRegions = (List<Map<String, Object>>) reportData.get("topRegions");
        if (topRegions != null) {
            writer.println("=== TOP RÉGIONS ===");
            writer.println("Région,Zones,Parcelles");
            for (Map<String, Object> region : topRegions) {
                writer.printf("\"%s\",%s,%s%n", 
                    escapeForCsv(String.valueOf(region.get("region"))),
                    region.get("zonesCount"),
                    region.get("parcelsCount"));
            }
        }
        
        writer.flush();
        writer.close();
        
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType("text/csv"));
        headers.setContentDispositionFormData("attachment", 
            "rapport_" + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss")) + ".csv");
        
        return ResponseEntity.ok()
            .headers(headers)
            .body(outputStream.toByteArray());
    }
    
    private ResponseEntity<byte[]> exportReportsToExcel(Map<String, Object> reportData) throws IOException {
        // Pour l'instant, on utilise le même format que CSV
        // TODO: Implémenter le vrai format Excel avec Apache POI
        return exportReportsToCsv(reportData);
    }
    
    private String escapeForCsv(String value) {
        if (value == null) {
            return "";
        }
        // Échapper les guillemets doubles en les doublant
        return value.replace("\"", "\"\"");
    }

}