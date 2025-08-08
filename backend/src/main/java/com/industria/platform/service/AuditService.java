package com.industria.platform.service;

import com.industria.platform.entity.AuditAction;
import com.industria.platform.entity.AuditLog;
import com.industria.platform.entity.User;
import com.industria.platform.repository.AuditLogRepository;
import com.industria.platform.repository.UserRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuditService {
    
    private final AuditLogRepository auditLogRepository;
    private final UserRepository userRepository;
    private final ObjectMapper objectMapper;
    
    public void log(AuditAction action, String entity, String entityId, Object oldValue, Object newValue, String description) {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            User user = getCurrentUser(auth);
            
            AuditLog auditLog = AuditLog.builder()
                .action(action)
                .entity(entity)
                .entityId(entityId)
                .oldValues(oldValue != null ? objectMapper.writeValueAsString(oldValue) : null)
                .newValues(newValue != null ? objectMapper.writeValueAsString(newValue) : null)
                .description(description)
                .user(user)
                .createdAt(LocalDateTime.now())
                .ipAddress(getClientIpAddress())
                .userAgent(getUserAgent())
                .build();
                
            auditLogRepository.save(auditLog);
            
        } catch (Exception e) {
            log.error("Erreur lors de l'enregistrement de l'audit log", e);
        }
    }
    
    public void log(AuditAction action, String entity, String entityId, String description) {
        log(action, entity, entityId, null, null, description);
    }
    
    public void log(AuditAction action, String entity, String description) {
        log(action, entity, null, null, null, description);
    }
    
    public Page<AuditLog> getAllAuditLogs(Pageable pageable) {
        return auditLogRepository.findAllByOrderByCreatedAtDesc(pageable);
    }
    
    public List<AuditLog> getAuditLogsByUser(User user) {
        return auditLogRepository.findByUserOrderByCreatedAtDesc(user);
    }
    
    public List<AuditLog> getAuditLogsByEntity(String entity, String entityId) {
        return auditLogRepository.findByEntityAndEntityIdOrderByCreatedAtDesc(entity, entityId);
    }
    
    public List<AuditLog> getAuditLogsByAction(AuditAction action) {
        return auditLogRepository.findByActionOrderByCreatedAtDesc(action);
    }
    
    public List<AuditLog> getAuditLogsByDateRange(LocalDateTime startDate, LocalDateTime endDate) {
        return auditLogRepository.findByDateRange(startDate, endDate);
    }
    
    private User getCurrentUser(Authentication auth) {
        if (auth != null && auth.getPrincipal() instanceof Jwt jwt) {
            String userId = jwt.getSubject();
            return userRepository.findById(userId).orElse(null);
        }
        return null;
    }
    
    private String getClientIpAddress() {
        try {
            ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.currentRequestAttributes();
            HttpServletRequest request = attributes.getRequest();
            
            String xForwardedFor = request.getHeader("X-Forwarded-For");
            if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
                return xForwardedFor.split(",")[0].trim();
            }
            
            String xRealIp = request.getHeader("X-Real-IP");
            if (xRealIp != null && !xRealIp.isEmpty()) {
                return xRealIp;
            }
            
            return request.getRemoteAddr();
        } catch (Exception e) {
            return "Unknown";
        }
    }
    
    private String getUserAgent() {
        try {
            ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.currentRequestAttributes();
            HttpServletRequest request = attributes.getRequest();
            return request.getHeader("User-Agent");
        } catch (Exception e) {
            return "Unknown";
        }
    }
}