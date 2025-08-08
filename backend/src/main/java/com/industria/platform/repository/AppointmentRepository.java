package com.industria.platform.repository;

import com.industria.platform.entity.Appointment;
import com.industria.platform.entity.AppointmentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

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
    @Query("SELECT COUNT(a) FROM Appointment a WHERE a.status = 'PENDING'")
    Long countPendingAppointments();
    
    /**
     * Compte les rendez-vous par statut.
     * 
     * @param status Statut des rendez-vous à compter
     * @return Nombre de rendez-vous avec ce statut
     */
    Long countByStatus(AppointmentStatus status);
}
