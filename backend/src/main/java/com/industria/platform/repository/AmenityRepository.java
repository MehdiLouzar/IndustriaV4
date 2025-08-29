package com.industria.platform.repository;

import com.industria.platform.entity.Amenity;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * Repository pour la gestion des équipements et services.
 * 
 * Fournit les opérations CRUD de base pour les équipements
 * et services disponibles dans les zones industrielles.
 * 
 * @author Industria Platform Team
 * @version 1.0
 * @since 1.0
 */
public interface AmenityRepository extends JpaRepository<Amenity, String> {}
