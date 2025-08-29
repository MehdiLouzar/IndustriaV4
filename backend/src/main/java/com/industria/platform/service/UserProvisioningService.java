package com.industria.platform.service;

import com.industria.platform.dto.UserDto;
import com.industria.platform.entity.User;
import com.industria.platform.entity.UserRole;
import com.industria.platform.repository.UserRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
@RequiredArgsConstructor
public class UserProvisioningService {

    private final UserRepository userRepository;

    /**
     * Upsert basé sur les claims validés du JWT. Utilisez le clientId de votre application
     * pour lire les rôles côté resource_access lorsque nécessaire.
     */
    @Transactional
    public User upsertFromClaims(Map<String, Object> claims, String clientIdForRoles) {
        String sub = (String) claims.get("sub");
        if (sub == null || sub.isBlank()) throw new IllegalStateException("Missing 'sub' claim");

        String email = extractEmail(claims);
        String name  = extractName(claims, email);
        UserRole role = extractPrimaryRole(claims, clientIdForRoles);

        // 1) par keycloakId, 2) sinon par email (si présent)
        User user = userRepository.findByKeycloakId(sub)
                .orElseGet(() -> email != null
                        ? userRepository.findByEmail(email).orElse(new User())
                        : new User());

        boolean changed = false;

        if (!Objects.equals(user.getKeycloakId(), sub)) { user.setKeycloakId(sub); changed = true; }
        if (email != null && !Objects.equals(user.getEmail(), email)) { user.setEmail(email); changed = true; }
        if (name != null && !name.isBlank() && !Objects.equals(user.getName(), name)) { user.setName(name); changed = true; }
        if (user.getRole() == null || user.getRole() != role) { user.setRole(role); changed = true; }

        if (user.getId() == null || changed) {
            return userRepository.save(user);
        }
        return user;
    }

    private String extractEmail(Map<String, Object> claims) {
        String email = (String) claims.get("email");
        if (email != null && !email.isBlank()) return email;
        String preferred = (String) claims.get("preferred_username");
        if (preferred != null && preferred.contains("@")) return preferred;
        return null;
    }

    private String extractName(Map<String, Object> claims, String email) {
        String preferred = (String) claims.get("preferred_username");
        String name = (String) claims.get("name");
        if (name != null && !name.isBlank()) return name;
        if (preferred != null && !preferred.isBlank()) return preferred;
        return email != null ? email : (String) claims.get("sub");
    }

    @SuppressWarnings("unchecked")
    private UserRole extractPrimaryRole(Map<String, Object> claims, String clientId) {
        Map<String, Object> realmAccess = (Map<String, Object>) claims.get("realm_access");
        if (realmAccess != null && realmAccess.get("roles") instanceof List<?> roles) {
            if (roles.contains("ADMIN")) return UserRole.ADMIN;
            if (roles.contains("ZONE_MANAGER")) return UserRole.ZONE_MANAGER;
            if (roles.contains("USER")) return UserRole.USER;
        }
        Map<String, Object> resourceAccess = (Map<String, Object>) claims.get("resource_access");
        if (resourceAccess != null) {
            Object clientBlock = resourceAccess.get(clientId);
            if (clientBlock instanceof Map<?, ?> cb) {
                Object raw = ((Map<String, Object>) cb).get("roles");
                if (raw instanceof List<?> roles) {
                    if (roles.contains("ADMIN")) return UserRole.ADMIN;
                    if (roles.contains("ZONE_MANAGER")) return UserRole.ZONE_MANAGER;
                    if (roles.contains("USER")) return UserRole.USER;
                }
            }
        }
        return UserRole.USER;
    }

    public UserDto toUserDto(User user, Integer zoneCount) {
        return new UserDto(user.getId(), user.getEmail(), user.getName(), user.getRole() != null ? user.getRole().name() : null, user.getCompany(), user.getPhone(),
                user.getDeletedAt() == null,  // active if not soft-deleted
                zoneCount);

    }
}
