package com.industria.platform.service;

import com.industria.platform.entity.Zone;
import com.industria.platform.entity.Parcel;
import com.industria.platform.entity.Appointment;
import com.industria.platform.repository.ZoneRepository;
import com.industria.platform.repository.ParcelRepository;
import com.industria.platform.repository.AppointmentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

/**
 * Service de gestion des permissions et autorisations.
 * 
 * Gère les contrôles d'accès basés sur les rôles utilisateur
 * pour les zones, parcelles, rendez-vous et fonctionnalités administratives.
 * 
 * Hiérarchie des rôles :
 * - ADMIN : accès complet à tout
 * - ZONE_MANAGER : gestion de ses propres zones/parcelles
 * - USER : accès en lecture seule
 * 
 * @author Industria Platform Team
 * @version 1.0
 * @since 1.0
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class PermissionService {

    private final ZoneRepository zoneRepository;
    private final ParcelRepository parcelRepository;
    private final AppointmentRepository appointmentRepository;
    private final UserService userService;

    /**
     * Vérifie si l'utilisateur actuel peut modifier une zone.
     * 
     * Règles :
     * - ADMIN : peut modifier toutes les zones
     * - ZONE_MANAGER : peut modifier uniquement ses zones créées
     * 
     * @param zoneId identifiant de la zone
     * @return true si la modification est autorisée
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
     * Vérifie si l'utilisateur actuel peut modifier une parcelle.
     * 
     * Règles :
     * - ADMIN : peut modifier toutes les parcelles
     * - ZONE_MANAGER : peut modifier uniquement ses parcelles créées
     * 
     * @param parcelId identifiant de la parcelle
     * @return true si la modification est autorisée
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
     * Vérifie si l'utilisateur actuel peut gérer un rendez-vous.
     * 
     * Basé sur la propriété de la parcelle/zone associée au rendez-vous.
     * 
     * Règles :
     * - ADMIN : peut gérer tous les rendez-vous
     * - ZONE_MANAGER : peut gérer les rendez-vous de ses parcelles/zones
     * 
     * @param appointmentId identifiant du rendez-vous
     * @return true si la gestion est autorisée
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
     * Vérifie si l'utilisateur a un rôle spécifique.
     * 
     * @param role rôle à vérifier (sans le préfixe ROLE_)
     * @return true si l'utilisateur possède ce rôle
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
     * Vérifie si l'utilisateur peut accéder à l'interface d'administration.
     * 
     * @return true si l'accès admin est autorisé
     */
    public boolean canAccessAdmin() {
        return hasRole("ADMIN") || hasRole("ZONE_MANAGER") || hasRole("MANAGER");
    }

    /**
     * Vérifie si l'utilisateur peut accéder à une fonction admin spécifique.
     * 
     * Fonctions ADMIN uniquement :
     * - users, countries, regions, zone-types, activities, amenities, 
     *   construction-types, audit-logs, reports
     * 
     * Fonctions ADMIN/ZONE_MANAGER/MANAGER :
     * - zones, parcels, appointments, contact-requests, notifications
     * 
     * @param function nom de la fonction admin
     * @return true si l'accès est autorisé
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
     * Vérifie si l'utilisateur est un simple utilisateur (sans rôles admin).
     * 
     * @return true si l'utilisateur n'a aucun rôle administratif
     */
    public boolean isRegularUser() {
        return !hasRole("ADMIN") && !hasRole("ZONE_MANAGER") && !hasRole("MANAGER");
    }

    /**
     * Récupère le rôle le plus élevé de l'utilisateur.
     * 
     * Hiérarchie (du plus élevé au plus bas) :
     * ADMIN > ZONE_MANAGER > MANAGER > USER
     * 
     * @return le rôle le plus élevé
     */
    public String getHighestRole() {
        if (hasRole("ADMIN")) return "ADMIN";
        if (hasRole("ZONE_MANAGER")) return "ZONE_MANAGER";
        if (hasRole("MANAGER")) return "MANAGER";
        return "USER";
    }
}