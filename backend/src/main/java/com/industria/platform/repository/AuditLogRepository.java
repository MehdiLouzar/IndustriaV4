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
    
    List<AuditLog> findByCreatedAtBetweenOrderByCreatedAtDesc(LocalDateTime startDate, LocalDateTime endDate);
    
    List<AuditLog> findAllByOrderByCreatedAtDesc();
    
    @Query("SELECT a FROM AuditLog a WHERE " +
           "(:action IS NULL OR a.action = :action) AND " +
           "(:entity IS NULL OR a.entity LIKE %:entity%) AND " +
           "(:userId IS NULL OR a.user.id = :userId) AND " +
           "(:dateFrom IS NULL OR a.createdAt >= :dateFrom) AND " +
           "(:dateTo IS NULL OR a.createdAt <= :dateTo) AND " +
           "(:search IS NULL OR LOWER(a.description) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           " LOWER(a.ipAddress) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           " LOWER(a.user.email) LIKE LOWER(CONCAT('%', :search, '%'))) " +
           "ORDER BY a.createdAt DESC")
    Page<AuditLog> findWithFilters(Pageable pageable, 
                                   @Param("action") String action,
                                   @Param("entity") String entity,
                                   @Param("userId") String userId,
                                   @Param("dateFrom") LocalDateTime dateFrom,
                                   @Param("dateTo") LocalDateTime dateTo,
                                   @Param("search") String search);
    
    @Query("SELECT a FROM AuditLog a WHERE " +
           "(:action IS NULL OR a.action = :action) AND " +
           "(:entity IS NULL OR a.entity LIKE %:entity%) AND " +
           "(:userId IS NULL OR a.user.id = :userId) AND " +
           "(:dateFrom IS NULL OR a.createdAt >= :dateFrom) AND " +
           "(:dateTo IS NULL OR a.createdAt <= :dateTo) AND " +
           "(:search IS NULL OR LOWER(a.description) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           " LOWER(a.ipAddress) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           " LOWER(a.user.email) LIKE LOWER(CONCAT('%', :search, '%'))) " +
           "ORDER BY a.createdAt DESC")
    List<AuditLog> findAllWithFilters(@Param("action") String action,
                                      @Param("entity") String entity,
                                      @Param("userId") String userId,
                                      @Param("dateFrom") LocalDateTime dateFrom,
                                      @Param("dateTo") LocalDateTime dateTo,
                                      @Param("search") String search);
}
