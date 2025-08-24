package com.industria.platform.repository;

import com.industria.platform.entity.Zone;
import com.industria.platform.entity.ZoneStatus;
import jakarta.persistence.criteria.CriteriaBuilder;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Repository pour la gestion des zones industrielles.
 * 
 * Fournit les opérations CRUD ainsi que des méthodes de recherche,
 * filtrage et statistiques pour les zones.
 * 
 * @author Industria Platform Team
 * @version 1.0
 * @since 1.0
 */
public interface ZoneRepository extends JpaRepository<Zone, String> {
    
    /**
     * Compte le nombre de zones créées par un utilisateur.
     * 
     * @param userId identifiant de l'utilisateur créateur
     * @return nombre de zones créées par l'utilisateur
     */
    int countByCreatedById(String userId);
    
    /**
     * Recherche des zones par nom ou adresse avec pagination.
     * La recherche est insensible à la casse.
     * 
     * @param nameKeyword mot-clé pour le nom
     * @param addressKeyword mot-clé pour l'adresse
     * @param pageable configuration de pagination
     * @return page de zones correspondant aux critères
     */
    Page<Zone> findByNameContainingIgnoreCaseOrAddressContainingIgnoreCase(
        String nameKeyword, String addressKeyword, Pageable pageable);
    
    /**
     * Récupère toutes les zones avec leurs parcelles et créateurs.
     * Utilise le lazy loading pour optimiser les performances.
     * 
     * @return liste de toutes les zones
     */
    default List<Zone> findAllWithParcelsAndCreators() {
        return findAll();
    }
    
    @Override
    List<Zone> findAll();
    
    /**
     * Compte les zones par statut.
     * Utilisé pour les statistiques administratives.
     * 
     * @param status statut des zones à compter
     * @return nombre de zones avec le statut donné
     */
    long countByStatus(ZoneStatus status);
    
    /**
     * Compte les zones créées dans une période donnée.
     * Utilisé pour les rapports temporels.
     * 
     * @param start date de début de la période
     * @param end date de fin de la période
     * @return nombre de zones créées dans la période
     */
    long countByCreatedAtBetween(LocalDateTime start, LocalDateTime end);
    
    /**
     * Compte les zones d'une région spécifique.
     * Utilisé pour les analyses géographiques.
     * 
     * @param regionId identifiant de la région
     * @return nombre de zones dans la région
     */
    long countByRegionId(String regionId);
    
    /**
     * Vérifie si une zone avec le nom donné existe (insensible à la casse).
     * 
     * @param name nom de la zone à vérifier
     * @return true si une zone avec ce nom existe, false sinon
     */
    boolean existsByNameIgnoreCase(String name);

    Integer countByCreatedBy_Id(String creatorId);



}
