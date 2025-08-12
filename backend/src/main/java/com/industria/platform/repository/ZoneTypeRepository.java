package com.industria.platform.repository;

import com.industria.platform.entity.ZoneType;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * Repository pour la gestion des types de zones.
 * 
 * Fournit les opérations CRUD de base pour les référentiels
 * types de zones industrielles.
 * 
 * @author Industria Platform Team
 * @version 1.0
 * @since 1.0
 */
public interface ZoneTypeRepository extends JpaRepository<ZoneType, String> {}
