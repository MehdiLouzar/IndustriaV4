package com.industria.platform.repository;

import com.industria.platform.entity.Region;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * Repository pour la gestion des régions.
 * 
 * Fournit les opérations CRUD de base pour les référentiels régions du Maroc.
 * 
 * @author Industria Platform Team
 * @version 1.0
 * @since 1.0
 */
public interface RegionRepository extends JpaRepository<Region, String> {}
