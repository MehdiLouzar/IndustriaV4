package com.industria.platform.repository;

import com.industria.platform.entity.NotificationTemplate;
import com.industria.platform.entity.NotificationType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface NotificationTemplateRepository extends JpaRepository<NotificationTemplate, String> {
    Page<NotificationTemplate> findByType(NotificationType type, Pageable pageable);
}
