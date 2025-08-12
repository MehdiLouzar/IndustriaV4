package com.industria.platform.repository;

import com.industria.platform.entity.NotificationTemplate;
import com.industria.platform.entity.NotificationType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * Repository pour la gestion des modèles de notifications.
 * 
 * Fournit les opérations CRUD pour les templates d'emails
 * utilisés par la plateforme avec recherche par type.
 * 
 * @author Industria Platform Team
 * @version 1.0
 * @since 1.0
 */
public interface NotificationTemplateRepository extends JpaRepository<NotificationTemplate, String> {
    Page<NotificationTemplate> findByType(NotificationType type, Pageable pageable);
}
