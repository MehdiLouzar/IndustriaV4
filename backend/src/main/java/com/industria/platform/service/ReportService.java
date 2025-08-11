package com.industria.platform.service;

import com.industria.platform.entity.AppointmentStatus;
import com.industria.platform.entity.ParcelStatus;
import com.industria.platform.entity.ZoneStatus;
import com.industria.platform.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class ReportService {

    private final ZoneRepository zoneRepository;
    private final ParcelRepository parcelRepository;
    private final UserRepository userRepository;
    private final AppointmentRepository appointmentRepository;
    private final ContactRequestRepository contactRequestRepository;
    private final RegionRepository regionRepository;

    /**
     * Récupère les statistiques générales pour le tableau de bord des rapports
     */
    public Map<String, Object> getReportStats(LocalDateTime from, LocalDateTime to) {
        Map<String, Object> stats = new HashMap<>();

        // Statistiques générales
        stats.put("totalZones", zoneRepository.count());
        stats.put("totalParcels", parcelRepository.count());
        stats.put("availableParcels", parcelRepository.countByStatus(ParcelStatus.LIBRE));
        stats.put("totalUsers", userRepository.count());
        stats.put("totalAppointments", appointmentRepository.count());
        stats.put("pendingAppointments", appointmentRepository.countByStatus(AppointmentStatus.PENDING));
        stats.put("totalContactRequests", contactRequestRepository.count());

        // Activité récente (7 derniers jours)
        List<Map<String, Object>> recentActivity = new ArrayList<>();
        LocalDateTime now = LocalDateTime.now();
        for (int i = 6; i >= 0; i--) {
            LocalDateTime dayStart = now.minusDays(i).toLocalDate().atStartOfDay();
            LocalDateTime dayEnd = dayStart.plusDays(1);
            
            Map<String, Object> dayActivity = new HashMap<>();
            dayActivity.put("date", dayStart.toLocalDate().toString());
            dayActivity.put("zonesCreated", zoneRepository.countByCreatedAtBetween(dayStart, dayEnd));
            dayActivity.put("appointmentsCreated", appointmentRepository.countByCreatedAtBetween(dayStart, dayEnd));
            dayActivity.put("usersRegistered", userRepository.countByCreatedAtBetween(dayStart, dayEnd));
            
            recentActivity.add(dayActivity);
        }
        stats.put("recentActivity", recentActivity);

        // Zones par statut
        List<Map<String, Object>> zonesByStatus = new ArrayList<>();
        try {
            for (ZoneStatus status : ZoneStatus.values()) {
                Map<String, Object> statusCount = new HashMap<>();
                statusCount.put("status", status.name());
                statusCount.put("count", zoneRepository.countByStatus(status));
                zonesByStatus.add(statusCount);
            }
        } catch (Exception e) {
            System.err.println("Erreur lors de la récupération des zones par statut: " + e.getMessage());
        }
        stats.put("zonesByStatus", zonesByStatus);

        // Parcelles par statut
        List<Map<String, Object>> parcelsByStatus = new ArrayList<>();
        try {
            for (ParcelStatus status : ParcelStatus.values()) {
                Map<String, Object> statusCount = new HashMap<>();
                statusCount.put("status", status.name());
                statusCount.put("count", parcelRepository.countByStatus(status));
                parcelsByStatus.add(statusCount);
            }
        } catch (Exception e) {
            System.err.println("Erreur lors de la récupération des parcelles par statut: " + e.getMessage());
        }
        stats.put("parcelsByStatus", parcelsByStatus);

        // RDV par statut
        List<Map<String, Object>> appointmentsByStatus = new ArrayList<>();
        try {
            for (AppointmentStatus status : AppointmentStatus.values()) {
                Map<String, Object> statusCount = new HashMap<>();
                statusCount.put("status", status.name());
                statusCount.put("count", appointmentRepository.countByStatus(status));
                appointmentsByStatus.add(statusCount);
            }
        } catch (Exception e) {
            System.err.println("Erreur lors de la récupération des RDV par statut: " + e.getMessage());
        }
        stats.put("appointmentsByStatus", appointmentsByStatus);

        // Top régions
        List<Map<String, Object>> topRegions = getTopRegions();
        stats.put("topRegions", topRegions);

        return stats;
    }

    /**
     * Récupère les données détaillées pour l'export de rapports
     */
    public Map<String, Object> getDetailedReportData(LocalDateTime from, LocalDateTime to) {
        // Pour l'instant, on réutilise les mêmes données que getReportStats
        // Dans une implémentation future, on peut ajouter plus de détails spécifiques à l'export
        return getReportStats(from, to);
    }

    /**
     * Récupère les régions les plus actives
     */
    private List<Map<String, Object>> getTopRegions() {
        List<Map<String, Object>> topRegions = new ArrayList<>();
        
        try {
            // Récupérer toutes les régions avec leurs zones et parcelles
            regionRepository.findAll().forEach(region -> {
                Map<String, Object> regionData = new HashMap<>();
                regionData.put("region", region.getName());
                
                // Compter les zones dans cette région
                long zonesCount = zoneRepository.countByRegionId(region.getId());
                regionData.put("zonesCount", zonesCount);
                
                // Compter les parcelles dans les zones de cette région
                long parcelsCount = parcelRepository.countByZone_RegionId(region.getId());
                regionData.put("parcelsCount", parcelsCount);
                
                // Ajouter seulement si il y a de l'activité
                if (zonesCount > 0 || parcelsCount > 0) {
                    topRegions.add(regionData);
                }
            });
            
            // Trier par nombre total d'éléments (zones + parcelles)
            topRegions.sort((a, b) -> {
                Long totalA = (Long) a.get("zonesCount") + (Long) a.get("parcelsCount");
                Long totalB = (Long) b.get("zonesCount") + (Long) b.get("parcelsCount");
                return totalB.compareTo(totalA);
            });
            
        } catch (Exception e) {
            // En cas d'erreur, retourner une liste vide
            System.err.println("Erreur lors de la récupération des top régions: " + e.getMessage());
        }
        
        return topRegions;
    }
}