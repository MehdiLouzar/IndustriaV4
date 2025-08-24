package com.industria.platform.repository;

import com.industria.platform.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDateTime;
import java.util.Optional;

/**
 * Repository pour la gestion des utilisateurs.
 * 
 * Fournit les opérations CRUD de base ainsi que des méthodes
 * de recherche spécialisées pour les utilisateurs.
 * 
 * @author Industria Platform Team
 * @version 1.0
 * @since 1.0
 */
public interface UserRepository extends JpaRepository<User, String> {
    
    /**
     * Recherche un utilisateur par son adresse email.
     * 
     * @param email adresse email de l'utilisateur
     * @return l'utilisateur correspondant ou Optional.empty()
     */
    Optional<User> findByEmail(String email);
    
    /**
     * Compte les utilisateurs créés dans une période donnée.
     * Utilisé pour les rapports et statistiques.
     * 
     * @param start date de début de la période
     * @param end date de fin de la période
     * @return nombre d'utilisateurs créés dans la période
     */
    long countByCreatedAtBetween(LocalDateTime start, LocalDateTime end);
    Optional<User> findByKeycloakId(String keycloakId);
}
