package com.industria.platform.repository;

import com.industria.platform.entity.Notification;
import com.industria.platform.entity.NotificationStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface NotificationRepository extends JpaRepository<Notification, String> {
    Page<Notification> findByStatus(NotificationStatus status, Pageable pageable);
}
