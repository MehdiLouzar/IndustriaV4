package com.industria.platform.controller;

import com.industria.platform.service.PermissionService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final PermissionService permissionService;

    public AdminController(PermissionService permissionService) {
        this.permissionService = permissionService;
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

}