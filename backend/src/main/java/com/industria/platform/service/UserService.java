package com.industria.platform.service;

import com.industria.platform.entity.User;
import com.industria.platform.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

/**
 * Service de gestion des utilisateurs.
 * 
 * Ce service gère la synchronisation entre Keycloak et la base de données locale,
 * ainsi que l'obtention des informations de l'utilisateur courant.
 * 
 * @author Industria Platform Team
 * @version 1.0
 * @since 1.0
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class UserService {

    private final UserRepository userRepository;

    /**
     * Obtient l'utilisateur actuel depuis le contexte de sécurité
     * Crée automatiquement l'utilisateur local s'il n'existe pas (synchronisation Keycloak)
     */
    public User getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null) {
            return null;
        }

        String userEmail = getCurrentUserEmail(auth);
        if (userEmail != null) {
            // Chercher l'utilisateur local
            return userRepository.findByEmail(userEmail)
                .orElseGet(() -> createUserFromKeycloak(auth, userEmail));
        }

        return null;
    }

    /**
     * Crée ou met à jour un utilisateur local à partir des informations Keycloak JWT
     */
    private User createUserFromKeycloak(Authentication auth, String email) {
        try {
            if (auth.getPrincipal() instanceof org.springframework.security.oauth2.jwt.Jwt jwt) {
                // Vérifier si l'utilisateur existe déjà (créé par initDB.sql par exemple)
                User user = userRepository.findByEmail(email).orElse(new User());
                user.setEmail(email);
                
                // Construire le nom complet de manière sûre
                String firstName = jwt.getClaimAsString("given_name");
                String lastName = jwt.getClaimAsString("family_name");
                String fullName = "";
                if (firstName != null && !firstName.isEmpty()) {
                    fullName = firstName;
                }
                if (lastName != null && !lastName.isEmpty()) {
                    if (!fullName.isEmpty()) fullName += " ";
                    fullName += lastName;
                }
                user.setName(fullName.isEmpty() ? email : fullName);
                
                user.setCompany("Keycloak Import");
                user.setPhone(jwt.getClaimAsString("phone_number"));
                
                // Extraire le rôle depuis les claims Keycloak
                @SuppressWarnings("unchecked")
                java.util.Map<String, Object> realmAccess = jwt.getClaimAsMap("realm_access");
                if (realmAccess != null && realmAccess.get("roles") instanceof java.util.List<?> roles) {
                    // Définir le rôle le plus élevé trouvé
                    if (roles.contains("ADMIN")) {
                        user.setRole(com.industria.platform.entity.UserRole.ADMIN);
                    } else if (roles.contains("ZONE_MANAGER")) {
                        user.setRole(com.industria.platform.entity.UserRole.ZONE_MANAGER);
                    } else {
                        user.setRole(com.industria.platform.entity.UserRole.USER);
                    }
                } else {
                    // Rôle par défaut si aucun rôle trouvé
                    user.setRole(com.industria.platform.entity.UserRole.USER);
                }
                
                return userRepository.save(user);
            }
        } catch (Exception e) {
            // Log l'erreur mais continue avec null
            log.error("Erreur lors de la création d'utilisateur depuis Keycloak: {}", e.getMessage(), e);
        }
        return null;
    }

    /**
     * Obtient l'email de l'utilisateur actuel depuis le JWT
     */
    public String getCurrentUserEmail() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return getCurrentUserEmail(auth);
    }

    private String getCurrentUserEmail(Authentication auth) {
        if (auth == null) return null;
        
        // Extraire l'email du token JWT (subject ou claim email)
        if (auth.getPrincipal() instanceof org.springframework.security.oauth2.jwt.Jwt jwt) {
            // Essayer d'abord le claim 'email', puis 'preferred_username', puis le 'subject'
            String email = jwt.getClaimAsString("email");
            if (email != null) return email;
            
            email = jwt.getClaimAsString("preferred_username");
            if (email != null) return email;
            
            return jwt.getSubject();
        }
        
        return auth.getName();
    }
}