package com.industria.platform.service;

import com.industria.platform.entity.User;
import com.industria.platform.entity.UserRole;
import com.industria.platform.repository.UserRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Service;

import java.util.Collection;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;

/**
 * Service de gestion des utilisateurs.
 *
 * - Récupère l'utilisateur courant depuis le contexte de sécurité.
 * - Provisionne/Met à jour le User local à partir d'un JWT validé (Keycloak).
 * - Évite la création de doublons via keycloakId (sub) et e-mail.
 *
 * Notes sécurité:
 * - On ne lit plus les rôles directement depuis les claims: on dérive le rôle
 *   depuis les autorités Spring (déjà mappées/validées par JwtAuthenticationConverter).
 * - 'sub' (Keycloak ID) est la source d'identité principale; l'e-mail peut changer.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class UserService {

    private final UserRepository userRepository;

    /**
     * Retourne l'utilisateur courant ou null si non authentifié.
     * (Compatibilité descendante avec votre signature actuelle.)
     */
    public User getCurrentUser() {
        return findCurrentUser().orElse(null);
    }

    /**
     * Retourne l'utilisateur courant (provisionné/à jour si besoin), sinon Optional.empty().
     * Préférer cette méthode à getCurrentUser() pour éviter les nulls.
     */
    public Optional<User> findCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (!(auth instanceof JwtAuthenticationToken jwtAuth) || !auth.isAuthenticated()) {
            return Optional.empty();
        }
        return Optional.of(provisionOrUpdateFromSecurity(jwtAuth));
    }

    /**
     * Provisionne/Met à jour un utilisateur local à partir du JWT validé + autorités Spring.
     * Transactionnel pour éviter les races (deux requêtes simultanées).
     */
    @Transactional
    protected User provisionOrUpdateFromSecurity(JwtAuthenticationToken jwtAuth) {
        Jwt jwt = jwtAuth.getToken();

        // Identité principale: sub (Keycloak ID)
        String keycloakId = jwt.getSubject();
        if (keycloakId == null || keycloakId.isBlank()) {
            // JWT invalide (mais normalement filtré avant d’arriver ici)
            throw new IllegalStateException("Le token ne contient pas de 'sub'.");
        }

        String email = safeEmail(jwt);
        String name = displayName(jwt, email);
        String phone = jwt.getClaimAsString("phone_number");

        // Rôle effectif: dérivé des autorités Spring (ROLE_*)
        UserRole role = highestRoleFromAuthorities(jwtAuth.getAuthorities())
                .orElse(UserRole.USER);

        // 1) Tenter par keycloakId, 2) sinon par e-mail (si présent)
        User user = userRepository.findByKeycloakId(keycloakId)
                .orElseGet(() -> (email != null)
                        ? userRepository.findByEmail(email).orElse(new User())
                        : new User());

        boolean changed = false;

        // Toujours forcer le keycloakId (source de vérité)
        if (!Objects.equals(user.getKeycloakId(), keycloakId)) {
            user.setKeycloakId(keycloakId);
            changed = true;
        }

        // Mettre à jour e-mail (si présent) sans écraser avec null
        if (email != null && !Objects.equals(user.getEmail(), email)) {
            user.setEmail(email);
            changed = true;
        }

        // Mettre à jour nom si différent
        if (name != null && !name.isBlank() && !Objects.equals(user.getName(), name)) {
            user.setName(name);
            changed = true;
        }

        // Mettre à jour téléphone uniquement si présent (ne pas écraser par null)
        if (phone != null && !Objects.equals(user.getPhone(), phone)) {
            user.setPhone(phone);
            changed = true;
        }

        // Mettre à jour rôle s’il a évolué
        if (user.getRole() == null || user.getRole() != role) {
            user.setRole(role);
            changed = true;
        }

        // Ne pas écraser company avec une valeur par défaut. Laisser tel quel si déjà rempli.

        if (user.getId() == null || changed) {
            // NB: Assurez-vous d’avoir des index/contraintes uniques en DB:
            //  - UNIQUE(keycloak_id)
            //  - UNIQUE(email) (facultatif si l’e-mail peut manquer/varier)
            return userRepository.save(user);
        }

        return user;
    }

    /**
     * Extrait un e-mail fiable:
     * - 'email' si présent (éventuellement vérifier 'email_verified' si vous l’exigez)
     * - sinon 'preferred_username' si c’est un e-mail
     * - sinon null (on reste basé sur sub).
     */
    private String safeEmail(Jwt jwt) {
        String email = jwt.getClaimAsString("email");
        if (email != null && !email.isBlank()) {
            // Boolean verified = jwt.getClaim("email_verified");
            // Si nécessaire, imposez verified == true ici.
            return email;
        }
        String preferred = jwt.getClaimAsString("preferred_username");
        if (preferred != null && preferred.contains("@")) {
            return preferred;
        }
        return null;
    }

    /**
     * Construit un nom d’affichage à partir de given_name/family_name; fallback sur e-mail; sinon sub.
     */
    private String displayName(Jwt jwt, String email) {
        String first = jwt.getClaimAsString("given_name");
        String last = jwt.getClaimAsString("family_name");

        StringBuilder sb = new StringBuilder();
        if (first != null && !first.isBlank()) sb.append(first);
        if (last != null && !last.isBlank()) {
            if (!sb.isEmpty()) sb.append(' ');
            sb.append(last);
        }

        if (!sb.isEmpty()) return sb.toString();
        if (email != null && !email.isBlank()) return email;
        return jwt.getSubject();
    }

    /**
     * Calcule le rôle le plus élevé à partir des autorités Spring (ROLE_ADMIN > ROLE_ZONE_MANAGER > ROLE_USER).
     * Évite de relire les claims bruts; respecte votre JwtAuthenticationConverter.
     */
    private Optional<UserRole> highestRoleFromAuthorities(Collection<? extends GrantedAuthority> authorities) {
        boolean isAdmin = hasRole(authorities, "ROLE_ADMIN");
        boolean isZoneManager = hasRole(authorities, "ROLE_ZONE_MANAGER");
        if (isAdmin) return Optional.of(UserRole.ADMIN);
        if (isZoneManager) return Optional.of(UserRole.ZONE_MANAGER);
        if (!authorities.isEmpty()) return Optional.of(UserRole.USER);
        return Optional.empty();
    }

    private boolean hasRole(Collection<? extends GrantedAuthority> authorities, String role) {
        for (GrantedAuthority ga : authorities) {
            if (role.equalsIgnoreCase(ga.getAuthority())) return true;
        }
        return false;
    }
}
