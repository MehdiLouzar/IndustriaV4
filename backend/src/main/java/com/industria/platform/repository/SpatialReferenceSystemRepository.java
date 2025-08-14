package com.industria.platform.repository;

import com.industria.platform.entity.SpatialReferenceSystem;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SpatialReferenceSystemRepository extends JpaRepository<SpatialReferenceSystem, String> {
    
    /**
     * Trouve un système de référence spatiale par son SRID.
     * 
     * @param srid le code SRID (ex: 4326, 2154, 26191)
     * @return le système de référence spatiale ou null si non trouvé
     */
    SpatialReferenceSystem findBySrid(Integer srid);
    
    /**
     * Recherche des systèmes par nom ou description avec pagination.
     * 
     * @param nameKeyword mot-clé pour le nom
     * @param descriptionKeyword mot-clé pour la description
     * @param pageable configuration de pagination
     * @return page de systèmes correspondant aux critères
     */
    Page<SpatialReferenceSystem> findByNameContainingIgnoreCaseOrDescriptionContainingIgnoreCase(
        String nameKeyword, String descriptionKeyword, Pageable pageable);
    
    /**
     * Vérifie si un système avec le nom donné existe (insensible à la casse).
     * 
     * @param name nom du système à vérifier
     * @return true si un système avec ce nom existe, false sinon
     */
    boolean existsByNameIgnoreCase(String name);
    
    /**
     * Vérifie si un système avec le SRID donné existe.
     * 
     * @param srid code SRID à vérifier
     * @return true si un système avec ce SRID existe, false sinon
     */
    boolean existsBySrid(Integer srid);
}
