package com.industria.platform.service;

import com.industria.platform.entity.Zone;
import com.industria.platform.entity.Parcel;
import com.industria.platform.entity.Appointment;
import com.industria.platform.repository.ZoneRepository;
import com.industria.platform.repository.ParcelRepository;
import com.industria.platform.repository.AppointmentRepository;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

@Service
public class PermissionService {

    private final ZoneRepository zoneRepository;
    private final ParcelRepository parcelRepository;
    private final AppointmentRepository appointmentRepository;
    private final UserService userService;

    public PermissionService(ZoneRepository zoneRepository, 
                           ParcelRepository parcelRepository,
                           AppointmentRepository appointmentRepository,
                           UserService userService) {
        this.zoneRepository = zoneRepository;
        this.parcelRepository = parcelRepository;
        this.appointmentRepository = appointmentRepository;
        this.userService = userService;
    }

    /**
     * Vérifie si l'utilisateur actuel peut modifier une zone
     */
    public boolean canModifyZone(String zoneId) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null) return false;

        // Les ADMIN peuvent tout modifier
        if (hasRole(auth, "ADMIN")) {
            return true;
        }

        // Les ZONE_MANAGER peuvent modifier seulement leurs zones
        if (hasRole(auth, "ZONE_MANAGER")) {
            Zone zone = zoneRepository.findById(zoneId).orElse(null);
            if (zone != null && zone.getCreatedBy() != null) {
                String currentUserEmail = userService.getCurrentUserEmail();
                return zone.getCreatedBy().getEmail().equals(currentUserEmail);
            }
        }

        return false;
    }

    /**
     * Vérifie si l'utilisateur actuel peut modifier une parcelle
     */
    public boolean canModifyParcel(String parcelId) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null) return false;

        // Les ADMIN peuvent tout modifier
        if (hasRole(auth, "ADMIN")) {
            return true;
        }

        // Les ZONE_MANAGER peuvent modifier seulement leurs parcelles
        if (hasRole(auth, "ZONE_MANAGER")) {
            Parcel parcel = parcelRepository.findById(parcelId).orElse(null);
            if (parcel != null && parcel.getCreatedBy() != null) {
                String currentUserEmail = userService.getCurrentUserEmail();
                return parcel.getCreatedBy().getEmail().equals(currentUserEmail);
            }
        }

        return false;
    }

    /**
     * Vérifie si l'utilisateur actuel peut gérer un rendez-vous
     * (basé sur la parcelle/zone associée au rendez-vous)
     */
    public boolean canManageAppointment(String appointmentId) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null) return false;

        // Les ADMIN peuvent gérer tous les rendez-vous
        if (hasRole(auth, "ADMIN")) {
            return true;
        }

        // Les ZONE_MANAGER peuvent gérer les rendez-vous de leurs parcelles/zones
        if (hasRole(auth, "ZONE_MANAGER")) {
            Appointment appointment = appointmentRepository.findById(appointmentId).orElse(null);
            if (appointment != null && appointment.getParcel() != null) {
                return canModifyParcel(appointment.getParcel().getId());
            }
        }

        return false;
    }

    /**
     * Vérifie si l'utilisateur a un rôle spécifique
     */
    public boolean hasRole(String role) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return hasRole(auth, role);
    }

    private boolean hasRole(Authentication auth, String role) {
        if (auth == null || auth.getAuthorities() == null) {
            return false;
        }
        return auth.getAuthorities().stream()
                .anyMatch(authority -> authority.getAuthority().equals("ROLE_" + role));
    }

    /**
     * Vérifie si l'utilisateur peut accéder à l'interface d'administration
     */
    public boolean canAccessAdmin() {
        return hasRole("ADMIN") || hasRole("ZONE_MANAGER") || hasRole("MANAGER");
    }

    /**
     * Vérifie si l'utilisateur peut voir une fonction admin spécifique
     */
    public boolean canAccessAdminFunction(String function) {
        return switch (function) {
            case "users", "countries", "regions", "zone-types", "activities", "amenities", 
                 "construction-types", "audit-logs", "reports" -> hasRole("ADMIN");
            case "zones", "parcels", "appointments", "contact-requests", "notifications" -> 
                 hasRole("ADMIN") || hasRole("ZONE_MANAGER") || hasRole("MANAGER");
            default -> false;
        };
    }

    /**
     * Vérifie si l'utilisateur est un simple utilisateur (sans rôles admin)
     */
    public boolean isRegularUser() {
        return !hasRole("ADMIN") && !hasRole("ZONE_MANAGER") && !hasRole("MANAGER");
    }

    /**
     * Récupère le rôle le plus élevé de l'utilisateur
     */
    public String getHighestRole() {
        if (hasRole("ADMIN")) return "ADMIN";
        if (hasRole("ZONE_MANAGER")) return "ZONE_MANAGER";
        if (hasRole("MANAGER")) return "MANAGER";
        return "USER";
    }
}