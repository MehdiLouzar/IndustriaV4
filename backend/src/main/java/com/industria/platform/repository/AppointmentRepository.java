package com.industria.platform.repository;

import com.industria.platform.entity.Appointment;
import com.industria.platform.entity.AppointmentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDateTime;
/**
 * Repository pour la gestion des rendez-vous.
 * 
 * Fournit les opérations CRUD ainsi que des méthodes de recherche
 * et statistiques pour les rendez-vous des investisseurs.
 * 
 * @author Industria Platform Team
 * @version 1.0
 * @since 1.0
 */
public interface AppointmentRepository extends JpaRepository<Appointment, String> {
    
    /**
     * Compte les rendez-vous par statut.
     * Utilisé pour les statistiques administratives.
     * 
     * @param status statut des rendez-vous à compter
     * @return nombre de rendez-vous avec le statut donné
     */
    Long countByStatus(AppointmentStatus status);
    
    /**
     * Compte les rendez-vous créés dans une période donnée.
     * Utilisé pour les rapports temporels.
     * 
     * @param start date de début de la période
     * @param end date de fin de la période
     * @return nombre de rendez-vous créés dans la période
     */
    long countByCreatedAtBetween(LocalDateTime start, LocalDateTime end);
}
