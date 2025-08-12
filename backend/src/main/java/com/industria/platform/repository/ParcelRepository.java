package com.industria.platform.repository;

import com.industria.platform.entity.Parcel;
import com.industria.platform.entity.ParcelStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Set;
import java.util.List;
import java.time.LocalDateTime;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

/**
 * Repository pour la gestion des parcelles industrielles.
 * 
 * Fournit les opérations CRUD ainsi que des méthodes de recherche,
 * filtrage et statistiques pour les parcelles.
 * 
 * @author Industria Platform Team
 * @version 1.0
 * @since 1.0
 */
public interface ParcelRepository extends JpaRepository<Parcel, String> {
    /**
     * Récupère toutes les parcelles d'une zone.
     * 
     * @param zoneId identifiant de la zone
     * @return ensemble des parcelles de la zone
     */
    Set<Parcel> findByZoneId(String zoneId);

    /**
     * Récupère les parcelles d'une zone avec pagination.
     * 
     * @param zoneId identifiant de la zone
     * @param pageable configuration de pagination
     * @return page de parcelles de la zone
     */
    Page<Parcel> findByZoneId(String zoneId, Pageable pageable);
    
    /**
     * Recherche des parcelles par référence avec pagination.
     * La recherche est insensible à la casse.
     * 
     * @param reference référence ou portion de référence
     * @param pageable configuration de pagination
     * @return page de parcelles correspondant au critère
     */
    Page<Parcel> findByReferenceContainingIgnoreCase(String reference, Pageable pageable);

    /**
     * Compte le nombre de parcelles dans une zone.
     * 
     * @param zoneId identifiant de la zone
     * @return nombre total de parcelles dans la zone
     */
    int countByZoneId(String zoneId);
    
    /**
     * Compte les parcelles d'une zone avec un statut spécifique.
     * 
     * @param zoneId identifiant de la zone
     * @param status statut des parcelles à compter
     * @return nombre de parcelles avec le statut donné dans la zone
     */
    int countByZoneIdAndStatus(String zoneId, ParcelStatus status);
    
    /**
     * Compte les parcelles par statut.
     * Utilisé pour les statistiques administratives.
     * 
     * @param status statut des parcelles à compter
     * @return nombre total de parcelles avec le statut donné
     */
    long countByStatus(ParcelStatus status);
    
    /**
     * Récupère les parcelles créées par un utilisateur.
     * 
     * @param createdById identifiant de l'utilisateur créateur
     * @return liste des parcelles créées par l'utilisateur
     */
    List<Parcel> findByCreatedById(String createdById);
    
    /**
     * Compte les parcelles par région.
     * Utilisé pour les analyses géographiques et rapports.
     * 
     * @param regionId identifiant de la région
     * @return nombre de parcelles dans la région
     */
    long countByZone_RegionId(String regionId);
}
