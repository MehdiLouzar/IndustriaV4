package com.industria.platform.repository;

import com.industria.platform.entity.Appointment;
import com.industria.platform.entity.AppointmentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDateTime;
/**
 * Repository pour la gestion des rendez-vous.
 * 
 * @author Industria Platform
 * @version 1.0
 */
public interface AppointmentRepository extends JpaRepository<Appointment, String> {
    
    /**
     * Compte le nombre de rendez-vous en attente de traitement.
     * 
     * @return Nombre de rendez-vous avec statut PENDING
     */
    Long countByStatus(AppointmentStatus status);
    
    /**
     * Méthodes pour les rapports
     */
    long countByCreatedAtBetween(LocalDateTime start, LocalDateTime end);
}
