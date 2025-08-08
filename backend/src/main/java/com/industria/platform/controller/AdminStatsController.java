package com.industria.platform.controller;

import com.industria.platform.dto.AdminStatsDto;
import com.industria.platform.service.AdminStatsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Contrôleur REST pour les statistiques administrateur.
 * 
 * Fournit des endpoints sécurisés pour récupérer les métriques
 * et statistiques du système pour le tableau de bord admin.
 * 
 * @author Industria Platform
 * @version 1.0
 */
@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN') or hasRole('ZONE_MANAGER')")
public class AdminStatsController {

    private final AdminStatsService adminStatsService;

    @Autowired
    public AdminStatsController(AdminStatsService adminStatsService) {
        this.adminStatsService = adminStatsService;
    }

    /**
     * Récupère les statistiques générales du système.
     * 
     * @return Statistiques incluant compteurs d'utilisateurs, zones, parcelles et rendez-vous
     */
    @GetMapping("/stats")
    public ResponseEntity<AdminStatsDto> getAdminStats() {
        AdminStatsDto stats = adminStatsService.getAdminStats();
        return ResponseEntity.ok(stats);
    }
}