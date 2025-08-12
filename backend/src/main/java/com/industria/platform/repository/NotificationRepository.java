package com.industria.platform.repository;

import com.industria.platform.entity.Notification;
import com.industria.platform.entity.NotificationStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * Repository pour la gestion des notifications.
 * 
 * Fournit les opérations CRUD et de recherche pour les notifications
 * envoyées par la plateforme avec filtrage par statut.
 * 
 * @author Industria Platform Team
 * @version 1.0
 * @since 1.0
 */
public interface NotificationRepository extends JpaRepository<Notification, String> {
    Page<Notification> findByStatus(NotificationStatus status, Pageable pageable);
}
