package com.industria.platform.repository;

import com.industria.platform.entity.AuditAction;
import com.industria.platform.entity.AuditLog;
import com.industria.platform.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface AuditLogRepository extends JpaRepository<AuditLog, String> {
    
    Page<AuditLog> findAllByOrderByCreatedAtDesc(Pageable pageable);
    
    List<AuditLog> findByUserOrderByCreatedAtDesc(User user);
    
    List<AuditLog> findByEntityAndEntityIdOrderByCreatedAtDesc(String entity, String entityId);
    
    List<AuditLog> findByActionOrderByCreatedAtDesc(AuditAction action);
    
    @Query("SELECT a FROM AuditLog a WHERE a.createdAt BETWEEN :startDate AND :endDate ORDER BY a.createdAt DESC")
    List<AuditLog> findByDateRange(@Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);
}
