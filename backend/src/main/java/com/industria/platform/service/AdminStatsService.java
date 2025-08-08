package com.industria.platform.service;

import com.industria.platform.dto.AdminStatsDto;
import com.industria.platform.entity.ParcelStatus;
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
    
    @Autowired
    public AdminStatsService(UserRepository userRepository, 
                           ZoneRepository zoneRepository, 
                           ParcelRepository parcelRepository,
                           AppointmentRepository appointmentRepository) {
        this.userRepository = userRepository;
        this.zoneRepository = zoneRepository;
        this.parcelRepository = parcelRepository;
        this.appointmentRepository = appointmentRepository;
    }

    /**
     * Génère les statistiques complètes pour le tableau de bord admin.
     * 
     * @return Statistiques du système
     */
    public AdminStatsDto getAdminStats() {
        // Compter les utilisateurs actifs
        Long totalUsers = userRepository.count();
        
        // Compter les zones
        Long totalZones = zoneRepository.count();
        
        // Compter les parcelles
        Long totalParcels = parcelRepository.count();
        Long availableParcels = parcelRepository.countByStatus(ParcelStatus.LIBRE);
        
        // Compter les rendez-vous
        Long totalAppointments = appointmentRepository.count();
        Long pendingAppointments = appointmentRepository.countPendingAppointments();
        
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