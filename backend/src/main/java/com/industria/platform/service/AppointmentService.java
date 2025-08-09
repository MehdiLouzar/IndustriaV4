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
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
public class AppointmentService {

    private static final Logger logger = LoggerFactory.getLogger(AppointmentService.class);

    private final AppointmentRepository appointmentRepository;
    private final ParcelRepository parcelRepository;
    private final EmailService emailService;
    private final AuditService auditService;

    public AppointmentService(AppointmentRepository appointmentRepository, 
                            ParcelRepository parcelRepository,
                            EmailService emailService,
                            AuditService auditService) {
        this.appointmentRepository = appointmentRepository;
        this.parcelRepository = parcelRepository;
        this.emailService = emailService;
        this.auditService = auditService;
    }

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
            logger.error("Erreur lors de l'envoi de l'email de confirmation pour RDV {}: {}", 
                        savedAppointment.getId(), e.getMessage());
        }
        
        // Envoyer email de notification au responsable de la zone
        try {
            User zoneManager = getZoneManager(parcel);
            if (zoneManager != null) {
                emailService.sendAppointmentNotificationToZoneManager(savedAppointment, zoneManager);
            }
        } catch (Exception e) {
            logger.error("Erreur lors de l'envoi de l'email de notification au responsable pour RDV {}: {}", 
                        savedAppointment.getId(), e.getMessage());
        }
        
        // Audit log
        auditService.log(AuditAction.CREATE, "Appointment", savedAppointment.getId(), 
            null, savedAppointment, 
            "Création d'un rendez-vous pour la parcelle: " + parcel.getReference());
        
        return savedAppointment;
    }

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
                logger.error("Erreur lors de l'envoi de l'email de mise à jour de statut pour RDV {}: {}", 
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
        logger.warn("Aucun responsable spécifique trouvé pour la parcelle {} dans la zone {}", 
                   parcel.getId(), 
                   parcel.getZone() != null ? parcel.getZone().getName() : "inconnue");
        
        return null;
    }
}
