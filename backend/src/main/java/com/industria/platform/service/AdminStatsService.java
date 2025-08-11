package com.industria.platform.service;

import com.industria.platform.dto.AdminStatsDto;
import com.industria.platform.entity.ParcelStatus;
import com.industria.platform.entity.AppointmentStatus;
import com.industria.platform.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

/**
 * Service pour la génération des statistiques administrateur.
 * 
 * @author Industria Platform
 * @version 1.0
 */
@Service
public class AdminStatsService {

    private final UserRepository userRepository;
    private final ZoneRepository zoneRepository;
    private final ParcelRepository parcelRepository;
    private final AppointmentRepository appointmentRepository;
    private final PermissionService permissionService;
    private final UserService userService;
    
    @Autowired
    public AdminStatsService(UserRepository userRepository, 
                           ZoneRepository zoneRepository, 
                           ParcelRepository parcelRepository,
                           AppointmentRepository appointmentRepository,
                           PermissionService permissionService,
                           UserService userService) {
        this.userRepository = userRepository;
        this.zoneRepository = zoneRepository;
        this.parcelRepository = parcelRepository;
        this.appointmentRepository = appointmentRepository;
        this.permissionService = permissionService;
        this.userService = userService;
    }

    /**
     * Génère les statistiques complètes pour le tableau de bord admin.
     * 
     * @return Statistiques du système
     */
    public AdminStatsDto getAdminStats() {
        Long totalUsers, totalZones, totalParcels, availableParcels;
        Long totalAppointments, pendingAppointments;
        
        // Si l'utilisateur est ADMIN, voir toutes les statistiques
        if (permissionService.hasRole("ADMIN")) {
            totalUsers = userRepository.count();
            totalZones = zoneRepository.count();
            totalParcels = parcelRepository.count();
            availableParcels = parcelRepository.countByStatus(ParcelStatus.LIBRE);
            totalAppointments = appointmentRepository.count();
            pendingAppointments = appointmentRepository.countByStatus(AppointmentStatus.PENDING);
        } 
        // Si l'utilisateur est ZONE_MANAGER, voir seulement ses parcelles
        else if (permissionService.hasRole("ZONE_MANAGER")) {
            String currentUserEmail = userService.getCurrentUserEmail();
            
            // Récupérer toutes les parcelles et filtrer par email du créateur
            List<com.industria.platform.entity.Parcel> allParcels = parcelRepository.findAll();
            List<com.industria.platform.entity.Parcel> userParcels = allParcels.stream()
                .filter(parcel -> parcel.getCreatedBy() != null && 
                              parcel.getCreatedBy().getEmail().equals(currentUserEmail))
                .toList();
            
            totalParcels = (long) userParcels.size();
            availableParcels = userParcels.stream()
                .filter(p -> ParcelStatus.LIBRE.equals(p.getStatus()))
                .count();
                
            // Compter les zones créées par le manager  
            List<com.industria.platform.entity.Zone> allZones = zoneRepository.findAll();
            totalZones = allZones.stream()
                .filter(zone -> zone.getCreatedBy() != null && 
                              zone.getCreatedBy().getEmail().equals(currentUserEmail))
                .count();
            
            // Les Zone Managers ne voient que leurs propres créations
            totalUsers = 0L; // Pas d'accès aux statistiques utilisateurs
            totalAppointments = 0L; // À implémenter si nécessaire
            pendingAppointments = 0L;
        }
        // Par défaut (autres rôles), aucune statistique
        else {
            totalUsers = 0L;
            totalZones = 0L;
            totalParcels = 0L;
            availableParcels = 0L;
            totalAppointments = 0L;
            pendingAppointments = 0L;
        }
        
        // Générer des activités récentes (simulées pour l'instant)
        List<AdminStatsDto.RecentActivityDto> recentActivities = generateRecentActivities();
        
        return new AdminStatsDto(
            totalUsers,
            totalZones,
            availableParcels,
            totalParcels,
            pendingAppointments,
            totalAppointments,
            recentActivities
        );
    }

    /**
     * Génère des activités récentes simulées.
     * TODO: Implémenter un vrai système d'audit log
     */
    private List<AdminStatsDto.RecentActivityDto> generateRecentActivities() {
        List<AdminStatsDto.RecentActivityDto> activities = new ArrayList<>();
        DateTimeFormatter formatter = DateTimeFormatter.ISO_LOCAL_DATE_TIME;
        
        // Quelques activités d'exemple
        activities.add(new AdminStatsDto.RecentActivityDto(
            "1",
            "Nouvelle zone créée",
            "Zone industrielle 'Parc Technologique Casa' ajoutée",
            new AdminStatsDto.UserSummaryDto("Admin Système"),
            LocalDateTime.now().minusHours(2).format(formatter)
        ));
        
        activities.add(new AdminStatsDto.RecentActivityDto(
            "2", 
            "Rendez-vous confirmé",
            "RDV pour parcelle P-123 confirmé",
            new AdminStatsDto.UserSummaryDto("Manager Commercial"),
            LocalDateTime.now().minusHours(5).format(formatter)
        ));
        
        activities.add(new AdminStatsDto.RecentActivityDto(
            "3",
            "Utilisateur créé", 
            "Nouveau compte client enregistré",
            new AdminStatsDto.UserSummaryDto("Système"),
            LocalDateTime.now().minusDays(1).format(formatter)
        ));
        
        return activities;
    }
}