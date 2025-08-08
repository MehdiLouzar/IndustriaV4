package com.industria.platform.service;

import com.industria.platform.entity.User;
import com.industria.platform.repository.UserRepository;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

@Service
public class UserService {

    private final UserRepository userRepository;

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    /**
     * Obtient l'utilisateur actuel depuis le contexte de sécurité
     */
    public User getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null) {
            return null;
        }

        String userEmail = getCurrentUserEmail(auth);
        if (userEmail != null) {
            return userRepository.findByEmail(userEmail).orElse(null);
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