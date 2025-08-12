package com.industria.platform.repository;

import com.industria.platform.entity.Activity;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * Repository pour la gestion des activités industrielles.
 * 
 * Fournit les opérations CRUD de base pour les types d'activités
 * autorisées dans les zones industrielles.
 * 
 * @author Industria Platform Team
 * @version 1.0
 * @since 1.0
 */
public interface ActivityRepository extends JpaRepository<Activity, String> {}
