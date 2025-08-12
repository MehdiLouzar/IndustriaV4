package com.industria.platform.repository;

import com.industria.platform.entity.Country;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * Repository pour la gestion des pays.
 * 
 * Fournit les opérations CRUD de base pour les référentiels pays.
 * 
 * @author Industria Platform Team
 * @version 1.0
 * @since 1.0
 */
public interface CountryRepository extends JpaRepository<Country, String> {}
