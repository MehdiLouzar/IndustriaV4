package com.industria.platform.service;

import com.industria.platform.entity.Appointment;
import com.industria.platform.entity.Parcel;
import com.industria.platform.entity.Zone;
import com.industria.platform.repository.AppointmentRepository;
import com.industria.platform.repository.ParcelRepository;
import com.industria.platform.repository.ZoneRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.Optional;

/**
 * Service des permissions/autorisation basées rôles et ownership.
 *
 * Rôles (du plus élevé au plus bas): ADMIN > ZONE_MANAGER > MANAGER > USER
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class PermissionService {

    private final ZoneRepository zoneRepository;
    private final ParcelRepository parcelRepository;
    private final AppointmentRepository appointmentRepository;
    private final UserService userService;

    /** Zones **/

    public boolean canModifyZone(String zoneId) {
        Authentication auth = getAuth();
        if (auth == null) return false;

        // ADMIN: tout accès
        if (hasRole(auth, "ADMIN")) return true;

        // ZONE_MANAGER: uniquement ses zones
        if (hasRole(auth, "ZONE_MANAGER")) {
            Optional<String> userId = currentUserId();
            if (userId.isEmpty()) return false;

            Zone zone = zoneRepository.findById(zoneId).orElse(null);
            if (zone == null || zone.getCreatedBy() == null) return false;

            return userId.get().equals(zone.getCreatedBy().getId());
        }

        return false;
    }

    /** Parcels **/

    public boolean canModifyParcel(String parcelId) {
        Authentication auth = getAuth();
        if (auth == null) return false;

        if (hasRole(auth, "ADMIN")) return true;

        if (hasRole(auth, "ZONE_MANAGER")) {
            Optional<String> userId = currentUserId();
            if (userId.isEmpty()) return false;

            Parcel parcel = parcelRepository.findById(parcelId).orElse(null);
            if (parcel == null || parcel.getCreatedBy() == null) return false;

            return userId.get().equals(parcel.getCreatedBy().getId());
        }

        return false;
    }

    /** Appointments **/

    public boolean canManageAppointment(String appointmentId) {
        Authentication auth = getAuth();
        if (auth == null) return false;

        if (hasRole(auth, "ADMIN")) return true;

        if (hasRole(auth, "ZONE_MANAGER")) {
            Optional<String> userId = currentUserId();
            if (userId.isEmpty()) return false;

            Appointment appt = appointmentRepository.findById(appointmentId).orElse(null);
            if (appt == null || appt.getParcel() == null || appt.getParcel().getCreatedBy() == null) return false;

            return userId.get().equals(appt.getParcel().getCreatedBy().getId());
        }

        return false;
    }

    /** Role checks **/

    public boolean hasRole(String role) {
        return hasRole(getAuth(), role);
    }

    public boolean canAccessAdmin() {
        return hasAnyRole("ADMIN", "ZONE_MANAGER", "MANAGER");
    }

    public boolean canAccessAdminFunction(String function) {
        return switch (function) {
            // ADMIN only
            case "users", "countries", "regions", "zone-types", "activities",
                    "amenities", "construction-types", "audit-logs", "reports" -> hasRole("ADMIN");
            // Shared
            case "zones", "parcels", "appointments", "contact-requests", "notifications" ->
                    hasAnyRole("ADMIN", "ZONE_MANAGER", "MANAGER");
            default -> false;
        };
    }

    public boolean isRegularUser() {
        return !hasAnyRole("ADMIN", "ZONE_MANAGER", "MANAGER");
    }

    public String getHighestRole() {
        if (hasRole("ADMIN")) return "ADMIN";
        if (hasRole("ZONE_MANAGER")) return "ZONE_MANAGER";
        if (hasRole("MANAGER")) return "MANAGER";
        return "USER";
    }

    /** Helpers **/

    private Authentication getAuth() {
        return SecurityContextHolder.getContext().getAuthentication();
    }

    private boolean hasAnyRole(String... roles) {
        Authentication auth = getAuth();
        if (auth == null || auth.getAuthorities() == null) return false;
        for (String r : roles) {
            if (hasRole(auth, r)) return true;
        }
        return false;
    }

    private boolean hasRole(Authentication auth, String role) {
        if (auth == null || auth.getAuthorities() == null) return false;
        final String expected = "ROLE_" + role;
        for (GrantedAuthority ga : auth.getAuthorities()) {
            if (expected.equalsIgnoreCase(ga.getAuthority())) return true;
        }
        return false;
    }

    private Optional<String> currentUserId() {
        try {
            return userService.findCurrentUser().map(u -> u.getId());
        } catch (Exception e) {
            log.warn("Unable to load current user id: {}", e.getMessage());
            return Optional.empty();
        }
    }
}
