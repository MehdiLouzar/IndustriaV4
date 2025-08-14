package com.industria.platform.repository;

import com.industria.platform.entity.SpatialReferenceSystem;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SpatialReferenceSystemRepository extends JpaRepository<SpatialReferenceSystem, String> {
    
    /**
     * Trouve un système de référence spatiale par son SRID.
     * 
     * @param srid le code SRID (ex: 4326, 2154, 26191)
     * @return le système de référence spatiale ou null si non trouvé
     */
    SpatialReferenceSystem findBySrid(Integer srid);
}
