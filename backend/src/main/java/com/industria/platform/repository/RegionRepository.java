package com.industria.platform.repository;

import com.industria.platform.entity.Region;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

/**
 * Repository pour la gestion des régions.
 * 
 * Fournit les opérations CRUD de base pour les référentiels régions.
 * 
 * @author Industria Platform Team
 * @version 1.0
 * @since 1.0
 */
public interface RegionRepository extends JpaRepository<Region, String> {
    
    /**
     * Trouve toutes les régions d'un pays donné.
     * 
     * @param countryId identifiant du pays
     * @return liste des régions du pays
     */
    List<Region> findByCountryId(String countryId);
}
