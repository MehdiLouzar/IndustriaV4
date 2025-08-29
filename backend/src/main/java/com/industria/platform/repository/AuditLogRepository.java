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

/**
 * Repository pour la gestion des logs d'audit.
 * 
 * Fournit les opérations CRUD ainsi que des méthodes de recherche
 * et filtrage avancées pour les logs d'audit du système.
 * 
 * Permet le suivi détaillé des actions utilisateurs avec des
 * capacités de filtrage multi-critères et de recherche textuelle.
 * 
 * @author Industria Platform Team
 * @version 1.0
 * @since 1.0
 */
public interface AuditLogRepository extends JpaRepository<AuditLog, String> {
    
    /**
     * Récupère tous les logs d'audit triés par date décroissante.
     *
     * @param pageable paramètres de pagination
     * @return page de logs d'audit
     */
    Page<AuditLog> findAllByOrderByCreatedAtDesc(Pageable pageable);
    
    /**
     * Récupère tous les logs d'audit d'un utilisateur spécifique.
     *
     * @param user utilisateur concerné
     * @return liste des logs triés par date décroissante
     */
    List<AuditLog> findByUserOrderByCreatedAtDesc(User user);
    
    /**
     * Récupère les logs d'audit pour une entité spécifique.
     *
     * @param entity nom de l'entité
     * @param entityId identifiant de l'entité
     * @return liste des logs triés par date décroissante
     */
    List<AuditLog> findByEntityAndEntityIdOrderByCreatedAtDesc(String entity, String entityId);
    
    /**
     * Récupère les logs d'audit pour un type d'action.
     *
     * @param action type d'action effectuée
     * @return liste des logs triés par date décroissante
     */
    List<AuditLog> findByActionOrderByCreatedAtDesc(AuditAction action);
    
    /**
     * Récupère les logs d'audit dans une période donnée.
     *
     * @param startDate date de début
     * @param endDate date de fin
     * @return liste des logs dans la période
     */
    List<AuditLog> findByCreatedAtBetweenOrderByCreatedAtDesc(LocalDateTime startDate, LocalDateTime endDate);
    
    /**
     * Récupère tous les logs d'audit sans pagination.
     * Utilisé pour l'export de données.
     *
     * @return liste complète des logs triés par date décroissante
     */
    List<AuditLog> findAllByOrderByCreatedAtDesc();
    
    /**
     * Recherche avancée avec filtrage multi-critères et pagination.
     * 
     * Permet de filtrer les logs par action, entité, utilisateur,
     * période temporelle et recherche textuelle libre.
     *
     * @param pageable paramètres de pagination
     * @param action filtre par type d'action (optionnel)
     * @param entity filtre par nom d'entité (optionnel, recherche partielle)
     * @param userId filtre par utilisateur (optionnel)
     * @param dateFrom date de début de période (optionnelle)
     * @param dateTo date de fin de période (optionnelle)
     * @param search recherche textuelle dans description, IP et email (optionnelle)
     * @return page de logs filtrés
     */
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
    
    /**
     * Recherche avancée avec filtrage multi-critères sans pagination.
     * Identique à findWithFilters mais retourne tous les résultats.
     * Utilisé pour l'export de données filtrées.
     *
     * @param action filtre par type d'action (optionnel)
     * @param entity filtre par nom d'entité (optionnel, recherche partielle)
     * @param userId filtre par utilisateur (optionnel)
     * @param dateFrom date de début de période (optionnelle)
     * @param dateTo date de fin de période (optionnelle)
     * @param search recherche textuelle dans description, IP et email (optionnelle)
     * @return liste complète des logs filtrés
     */
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
