package com.industria.platform.service;

import com.industria.platform.entity.Appointment;
import com.industria.platform.entity.AppointmentStatus;
import com.industria.platform.entity.AuditAction;
import com.industria.platform.entity.Parcel;
import com.industria.platform.entity.ParcelStatus;
import com.industria.platform.entity.User;
import com.industria.platform.exception.BusinessRuleException;
import com.industria.platform.repository.AppointmentRepository;
import com.industria.platform.repository.ParcelRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

/**
 * Service de gestion des rendez-vous.
 * 
 * Gère la création, la mise à jour et les notifications pour les rendez-vous
 * entre investisseurs et gestionnaires de zones industrielles.
 * 
 * @author Industria Platform Team
 * @version 1.0
 * @since 1.0
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AppointmentService {

    private final AppointmentRepository appointmentRepository;
    private final ParcelRepository parcelRepository;
    private final EmailService emailService;
    private final AuditService auditService;

    /**
     * Crée un nouveau rendez-vous pour une parcelle donnée.
     * 
     * Vérifie la disponibilité de la parcelle, envoie les notifications email
     * automatiques et enregistre l'action dans l'audit.
     * 
     * @param appointment données du rendez-vous
     * @param parcelId identifiant de la parcelle concernée
     * @return le rendez-vous créé
     * @throws BusinessRuleException si la parcelle n'est pas disponible
     */
    @Transactional
    public Appointment createAppointment(Appointment appointment, String parcelId) {
        Parcel parcel = parcelRepository.findById(parcelId).orElseThrow();
        if (parcel.getStatus() != ParcelStatus.LIBRE) {
            throw new BusinessRuleException("Parcel not available for appointment");
        }
        
        appointment.setParcel(parcel);
        appointment.setStatus(AppointmentStatus.PENDING);
        appointment.setCreatedAt(LocalDateTime.now());
        appointment.setUpdatedAt(LocalDateTime.now());
        
        Appointment savedAppointment = appointmentRepository.save(appointment);
        
        // Envoyer email de confirmation au demandeur
        try {
            emailService.sendAppointmentConfirmationEmail(savedAppointment);
        } catch (Exception e) {
            log.error("Erreur lors de l'envoi de l'email de confirmation pour RDV {}: {}", 
                        savedAppointment.getId(), e.getMessage());
        }
        
        // Envoyer email de notification au responsable de la zone
        try {
            User zoneManager = getZoneManager(parcel);
            if (zoneManager != null) {
                emailService.sendAppointmentNotificationToZoneManager(savedAppointment, zoneManager);
            }
        } catch (Exception e) {
            log.error("Erreur lors de l'envoi de l'email de notification au responsable pour RDV {}: {}", 
                        savedAppointment.getId(), e.getMessage());
        }
        
        // Audit log
        auditService.log(AuditAction.CREATE, "Appointment", savedAppointment.getId(), 
            null, savedAppointment, 
            "Création d'un rendez-vous pour la parcelle: " + parcel.getReference());
        
        return savedAppointment;
    }

    /**
     * Met à jour le statut d'un rendez-vous.
     * 
     * Envoie automatiquement les notifications email de changement de statut
     * et enregistre la modification dans l'audit.
     * 
     * @param appointmentId identifiant du rendez-vous
     * @param newStatus nouveau statut
     * @param notes notes optionnelles
     * @return le rendez-vous mis à jour
     */
    @Transactional
    public Appointment updateAppointmentStatus(String appointmentId, AppointmentStatus newStatus, String notes) {
        Appointment appointment = appointmentRepository.findById(appointmentId).orElseThrow();
        AppointmentStatus oldStatus = appointment.getStatus();
        
        appointment.setStatus(newStatus);
        appointment.setUpdatedAt(LocalDateTime.now());
        if (notes != null && !notes.trim().isEmpty()) {
            appointment.setNotes(notes);
        }
        
        // Si le statut est confirmé et qu'il n'y a pas encore de date confirmée
        if (newStatus == AppointmentStatus.CONFIRMED && appointment.getConfirmedDate() == null) {
            appointment.setConfirmedDate(appointment.getRequestedDate() != null ? 
                                       appointment.getRequestedDate() : LocalDateTime.now());
        }
        
        Appointment updatedAppointment = appointmentRepository.save(appointment);
        
        // Envoyer email de mise à jour du statut au demandeur
        if (oldStatus != newStatus) {
            try {
                emailService.sendAppointmentStatusUpdateEmail(updatedAppointment, oldStatus);
            } catch (Exception e) {
                log.error("Erreur lors de l'envoi de l'email de mise à jour de statut pour RDV {}: {}", 
                            appointmentId, e.getMessage());
            }
            
            // Audit log
            auditService.log(AuditAction.UPDATE, "Appointment", appointmentId, 
                oldStatus, newStatus, 
                "Changement de statut du rendez-vous: " + oldStatus + " -> " + newStatus);
        }
        
        return updatedAppointment;
    }

    /**
     * Détermine le responsable de zone basé sur la hiérarchie :
     * 1. Créateur de la parcelle
     * 2. Créateur de la zone
     * 3. Admin par défaut
     */
    private User getZoneManager(Parcel parcel) {
        // D'abord, essayer le créateur de la parcelle
        if (parcel.getCreatedBy() != null) {
            return parcel.getCreatedBy();
        }
        
        // Ensuite, essayer le créateur de la zone
        if (parcel.getZone() != null && parcel.getZone().getCreatedBy() != null) {
            return parcel.getZone().getCreatedBy();
        }
        
        // Pas de responsable spécifique trouvé
        log.warn("Aucun responsable spécifique trouvé pour la parcelle {} dans la zone {}", 
                   parcel.getId(), 
                   parcel.getZone() != null ? parcel.getZone().getName() : "inconnue");
        
        return null;
    }
}
