package com.industria.platform.controller;

import com.industria.platform.repository.*;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin/reports")
@PreAuthorize("hasRole('ADMIN') or hasRole('ZONE_MANAGER')")
public class ReportsController {

    private final ZoneRepository zoneRepository;
    private final ParcelRepository parcelRepository;
    private final AppointmentRepository appointmentRepository;
    private final ContactRequestRepository contactRequestRepository;
    private final UserRepository userRepository;

    public ReportsController(
            ZoneRepository zoneRepository,
            ParcelRepository parcelRepository,
            AppointmentRepository appointmentRepository,
            ContactRequestRepository contactRequestRepository,
            UserRepository userRepository) {
        this.zoneRepository = zoneRepository;
        this.parcelRepository = parcelRepository;
        this.appointmentRepository = appointmentRepository;
        this.contactRequestRepository = contactRequestRepository;
        this.userRepository = userRepository;
    }

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getReportStats(
            @RequestParam(required = false) String from,
            @RequestParam(required = false) String to) {
        
        // Statistiques de base
        long totalZones = zoneRepository.count();
        long totalParcels = parcelRepository.count();
        long availableParcels = parcelRepository.countByStatus(com.industria.platform.entity.ParcelStatus.LIBRE);
        long totalUsers = userRepository.count();
        long totalAppointments = appointmentRepository.count();
        long pendingAppointments = appointmentRepository.countByStatus(com.industria.platform.entity.AppointmentStatus.PENDING);
        long totalContactRequests = contactRequestRepository.count();

        // Zones par statut
        List<Map<String, Object>> zonesByStatus = zoneRepository.findAll().stream()
                .collect(Collectors.groupingBy(
                    zone -> zone.getStatus() != null ? zone.getStatus() : "UNKNOWN",
                    Collectors.counting()
                ))
                .entrySet().stream()
                .map(entry -> Map.<String, Object>of(
                    "status", entry.getKey(),
                    "count", entry.getValue()
                ))
                .collect(Collectors.toList());

        // Parcelles par statut
        List<Map<String, Object>> parcelsByStatus = parcelRepository.findAll().stream()
                .collect(Collectors.groupingBy(
                    parcel -> parcel.getStatus() != null ? parcel.getStatus().name() : "UNKNOWN",
                    Collectors.counting()
                ))
                .entrySet().stream()
                .map(entry -> Map.<String, Object>of(
                    "status", entry.getKey(),
                    "count", entry.getValue()
                ))
                .collect(Collectors.toList());

        // Rendez-vous par statut
        List<Map<String, Object>> appointmentsByStatus = appointmentRepository.findAll().stream()
                .collect(Collectors.groupingBy(
                    appointment -> appointment.getStatus() != null ? appointment.getStatus().name() : "UNKNOWN",
                    Collectors.counting()
                ))
                .entrySet().stream()
                .map(entry -> Map.<String, Object>of(
                    "status", entry.getKey(),
                    "count", entry.getValue()
                ))
                .collect(Collectors.toList());

        // Top régions (simulé avec données disponibles)
        List<Map<String, Object>> topRegions = zoneRepository.findAll().stream()
                .collect(Collectors.groupingBy(
                    zone -> zone.getRegion() != null ? zone.getRegion().getName() : "Région inconnue",
                    Collectors.counting()
                ))
                .entrySet().stream()
                .map(entry -> Map.<String, Object>of(
                    "region", entry.getKey(),
                    "zonesCount", entry.getValue(),
                    "parcelsCount", parcelRepository.findAll().stream()
                            .filter(p -> p.getZone() != null && p.getZone().getRegion() != null 
                                    && entry.getKey().equals(p.getZone().getRegion().getName()))
                            .count()
                ))
                .collect(Collectors.toList());

        // Activité récente (7 derniers jours - simulée)
        List<Map<String, Object>> recentActivity = List.of(
            Map.<String, Object>of(
                "date", LocalDateTime.now().minusDays(6).toString(),
                "zonesCreated", 2,
                "appointmentsCreated", 5,
                "usersRegistered", 1
            ),
            Map.<String, Object>of(
                "date", LocalDateTime.now().minusDays(5).toString(),
                "zonesCreated", 1,
                "appointmentsCreated", 3,
                "usersRegistered", 2
            ),
            Map.<String, Object>of(
                "date", LocalDateTime.now().minusDays(4).toString(),
                "zonesCreated", 0,
                "appointmentsCreated", 7,
                "usersRegistered", 0
            ),
            Map.<String, Object>of(
                "date", LocalDateTime.now().minusDays(3).toString(),
                "zonesCreated", 3,
                "appointmentsCreated", 4,
                "usersRegistered", 3
            ),
            Map.<String, Object>of(
                "date", LocalDateTime.now().minusDays(2).toString(),
                "zonesCreated", 1,
                "appointmentsCreated", 6,
                "usersRegistered", 1
            ),
            Map.<String, Object>of(
                "date", LocalDateTime.now().minusDays(1).toString(),
                "zonesCreated", 2,
                "appointmentsCreated", 8,
                "usersRegistered", 4
            ),
            Map.<String, Object>of(
                "date", LocalDateTime.now().toString(),
                "zonesCreated", 1,
                "appointmentsCreated", 2,
                "usersRegistered", 0
            )
        );

        Map<String, Object> stats = new java.util.HashMap<>();
        stats.put("totalZones", totalZones);
        stats.put("totalParcels", totalParcels);
        stats.put("availableParcels", availableParcels);
        stats.put("totalUsers", totalUsers);
        stats.put("totalAppointments", totalAppointments);
        stats.put("pendingAppointments", pendingAppointments);
        stats.put("totalContactRequests", totalContactRequests);
        stats.put("zonesByStatus", zonesByStatus);
        stats.put("parcelsByStatus", parcelsByStatus);
        stats.put("appointmentsByStatus", appointmentsByStatus);
        stats.put("topRegions", topRegions);
        stats.put("recentActivity", recentActivity);

        return ResponseEntity.ok(stats);
    }

    @GetMapping("/export")
    public ResponseEntity<String> exportReport(
            @RequestParam(defaultValue = "csv") String format,
            @RequestParam(required = false) String from,
            @RequestParam(required = false) String to) {
        
        // Pour le moment, retournons juste un message
        return ResponseEntity.ok("Export en format " + format + " sera implémenté prochainement");
    }
}