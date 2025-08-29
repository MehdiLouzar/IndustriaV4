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

/**
 * Service de gestion des logs d'audit.
 * 
 * Ce service permet de tracer et enregistrer toutes les actions importantes
 * effectuées dans l'application pour des besoins de conformité et de sécurité.
 * 
 * Les logs d'audit incluent les informations sur l'utilisateur, l'action,
 * l'entité modifiée, les anciennes et nouvelles valeurs, ainsi que les
 * métadonnées contextuelles (IP, User-Agent, timestamp).
 * 
 * @author Industria Platform Team
 * @version 1.0
 * @since 1.0
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AuditService {
    
    private final AuditLogRepository auditLogRepository;
    private final UserRepository userRepository;
    private final ObjectMapper objectMapper;
    
    /**
     * Enregistre une action d'audit complète avec anciennes et nouvelles valeurs.
     *
     * @param action type d'action effectuée
     * @param entity nom de l'entité affectée
     * @param entityId identifiant de l'entité
     * @param oldValue anciennes valeurs (sérialisées en JSON)
     * @param newValue nouvelles valeurs (sérialisées en JSON)
     * @param description description détaillée de l'action
     */
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
    
    /**
     * Enregistre une action d'audit simple sans tracking des valeurs.
     *
     * @param action type d'action effectuée
     * @param entity nom de l'entité affectée
     * @param entityId identifiant de l'entité
     * @param description description de l'action
     */
    public void log(AuditAction action, String entity, String entityId, String description) {
        log(action, entity, entityId, null, null, description);
    }
    
    /**
     * Enregistre une action d'audit générale sans entité spécifique.
     *
     * @param action type d'action effectuée
     * @param entity nom de l'entité concernée
     * @param description description de l'action
     */
    public void log(AuditAction action, String entity, String description) {
        log(action, entity, null, null, null, description);
    }
    
    /**
     * Récupère tous les logs d'audit avec pagination.
     *
     * @param pageable paramètres de pagination
     * @return page de logs d'audit triés par date décroissante
     */
    public Page<AuditLog> getAllAuditLogs(Pageable pageable) {
        return auditLogRepository.findAllByOrderByCreatedAtDesc(pageable);
    }
    
    /**
     * Récupère tous les logs d'audit d'un utilisateur spécifique.
     *
     * @param user utilisateur concerné
     * @return liste des logs triés par date décroissante
     */
    public List<AuditLog> getAuditLogsByUser(User user) {
        return auditLogRepository.findByUserOrderByCreatedAtDesc(user);
    }
    
    /**
     * Récupère tous les logs d'audit pour une entité spécifique.
     *
     * @param entity nom de l'entité
     * @param entityId identifiant de l'entité
     * @return liste des logs triés par date décroissante
     */
    public List<AuditLog> getAuditLogsByEntity(String entity, String entityId) {
        return auditLogRepository.findByEntityAndEntityIdOrderByCreatedAtDesc(entity, entityId);
    }
    
    /**
     * Récupère tous les logs d'audit pour un type d'action.
     *
     * @param action type d'action à filtrer
     * @return liste des logs triés par date décroissante
     */
    public List<AuditLog> getAuditLogsByAction(AuditAction action) {
        return auditLogRepository.findByActionOrderByCreatedAtDesc(action);
    }
    
    /**
     * Récupère les logs d'audit dans une période donnée.
     *
     * @param startDate date de début
     * @param endDate date de fin
     * @return liste des logs dans la période, triés par date décroissante
     */
    public List<AuditLog> getAuditLogsByDateRange(LocalDateTime startDate, LocalDateTime endDate) {
        return auditLogRepository.findByCreatedAtBetweenOrderByCreatedAtDesc(startDate, endDate);
    }
    
    /**
     * Récupère les logs d'audit avec filtres et pagination.
     *
     * @param pageable paramètres de pagination
     * @param action filtre par type d'action
     * @param entity filtre par entité
     * @param userId filtre par utilisateur
     * @param dateFrom date de début de période
     * @param dateTo date de fin de période
     * @param search recherche textuelle
     * @return page de logs filtrés
     */
    public Page<AuditLog> getFilteredAuditLogs(Pageable pageable, String action, String entity, 
                                               String userId, LocalDateTime dateFrom, 
                                               LocalDateTime dateTo, String search) {
        // Si aucun filtre n'est appliqué, utiliser la méthode existante
        if (action == null && entity == null && userId == null && 
            dateFrom == null && dateTo == null && search == null) {
            return getAllAuditLogs(pageable);
        }
        
        // Utiliser le repository pour les filtres complexes
        return auditLogRepository.findWithFilters(pageable, action, entity, userId, 
                                                  dateFrom, dateTo, search);
    }
    
    /**
     * Récupère tous les logs d'audit avec filtres sans pagination.
     * Utilisé principalement pour l'export de données.
     *
     * @param action filtre par type d'action
     * @param entity filtre par entité
     * @param userId filtre par utilisateur
     * @param dateFrom date de début de période
     * @param dateTo date de fin de période
     * @param search recherche textuelle
     * @return liste complète des logs filtrés
     */
    public List<AuditLog> getAllFilteredAuditLogs(String action, String entity, String userId, 
                                                  LocalDateTime dateFrom, LocalDateTime dateTo, 
                                                  String search) {
        // Si aucun filtre n'est appliqué, retourner tous les logs
        if (action == null && entity == null && userId == null && 
            dateFrom == null && dateTo == null && search == null) {
            return auditLogRepository.findAllByOrderByCreatedAtDesc();
        }
        
        // Utiliser le repository pour les filtres complexes
        return auditLogRepository.findAllWithFilters(action, entity, userId, 
                                                     dateFrom, dateTo, search);
    }
    
    /**
     * Extrait l'utilisateur courant depuis le contexte d'authentification.
     *
     * @param auth contexte d'authentification
     * @return utilisateur courant ou null si non trouvé
     */
    private User getCurrentUser(Authentication auth) {
        if (auth != null && auth.getPrincipal() instanceof Jwt jwt) {
            String userId = jwt.getSubject();
            return userRepository.findById(userId).orElse(null);
        }
        return null;
    }
    
    /**
     * Récupère l'adresse IP du client en tenant compte des proxies.
     *
     * @return adresse IP du client ou "Unknown"
     */
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
    
    /**
     * Récupère le User-Agent du client depuis la requête HTTP.
     *
     * @return User-Agent ou "Unknown"
     */
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