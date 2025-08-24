package com.industria.platform.service;

import com.industria.platform.dto.AdminStatsDto;
import com.industria.platform.entity.AppointmentStatus;
import com.industria.platform.entity.ParcelStatus;
import com.industria.platform.repository.AppointmentRepository;
import com.industria.platform.repository.ParcelRepository;
import com.industria.platform.repository.UserRepository;
import com.industria.platform.repository.ZoneRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class AdminStatsService {

    private final UserRepository userRepository;
    private final ZoneRepository zoneRepository;
    private final ParcelRepository parcelRepository;
    private final AppointmentRepository appointmentRepository;
    private final PermissionService permissionService;
    private final UserService userService;

    public AdminStatsDto getAdminStats() {
        long totalUsers = 0, totalZones = 0, totalParcels = 0, availableParcels = 0;
        long totalAppointments = 0, pendingAppointments = 0;

        if (permissionService.hasRole("ADMIN")) {
            totalUsers = userRepository.count();
            totalZones = zoneRepository.count();
            totalParcels = parcelRepository.count();
            availableParcels = parcelRepository.countByStatus(ParcelStatus.LIBRE);
            totalAppointments = appointmentRepository.count();
            pendingAppointments = appointmentRepository.countByStatus(AppointmentStatus.PENDING);
        } else if (permissionService.hasRole("ZONE_MANAGER")) {
            var currentUserOpt = userService.findCurrentUser();
            if (currentUserOpt.isPresent()) {
                String userId = currentUserOpt.get().getId();

                totalParcels = parcelRepository.countByCreatedBy_Id(userId);
                availableParcels = parcelRepository.countByCreatedBy_IdAndStatus(userId, ParcelStatus.LIBRE);

                totalZones = zoneRepository.countByCreatedBy_Id(userId);

                totalAppointments = appointmentRepository.countByParcel_CreatedBy_Id(userId);
                pendingAppointments = appointmentRepository.countByParcel_CreatedBy_IdAndStatus(userId, AppointmentStatus.PENDING);

                totalUsers = 0; // managers do not see system-wide user stats
            } else {
                // not authenticated or cannot load user
                log.debug("No current user found for manager stats, returning zeros");
            }
        } else {
            // other roles: zeros by policy
        }

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
     * Demo data for now. Replace with real audit feed when ready.
     */
    private List<AdminStatsDto.RecentActivityDto> generateRecentActivities() {
        var activities = new ArrayList<AdminStatsDto.RecentActivityDto>();
        var fmt = DateTimeFormatter.ISO_LOCAL_DATE_TIME;

        activities.add(new AdminStatsDto.RecentActivityDto(
                "1",
                "Nouvelle zone créée",
                "Zone industrielle 'Parc Technologique Casa' ajoutée",
                new AdminStatsDto.UserSummaryDto("Admin Système"),
                LocalDateTime.now().minusHours(2).format(fmt)
        ));

        activities.add(new AdminStatsDto.RecentActivityDto(
                "2",
                "Rendez-vous confirmé",
                "RDV pour parcelle P-123 confirmé",
                new AdminStatsDto.UserSummaryDto("Manager Commercial"),
                LocalDateTime.now().minusHours(5).format(fmt)
        ));

        activities.add(new AdminStatsDto.RecentActivityDto(
                "3",
                "Utilisateur créé",
                "Nouveau compte client enregistré",
                new AdminStatsDto.UserSummaryDto("Système"),
                LocalDateTime.now().minusDays(1).format(fmt)
        ));

        return activities;
    }
}
