package com.industria.platform.repository;

import com.industria.platform.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDateTime;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, String> {
    Optional<User> findByEmail(String email);
    
    // Méthodes pour les rapports
    long countByCreatedAtBetween(LocalDateTime start, LocalDateTime end);
}
