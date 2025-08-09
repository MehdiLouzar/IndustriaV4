package com.industria.platform.service;

import com.industria.platform.entity.ContactRequest;
import com.industria.platform.entity.Appointment;
import com.industria.platform.entity.AppointmentStatus;
import com.industria.platform.entity.User;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.math.BigDecimal;
import java.text.NumberFormat;
import java.time.format.DateTimeFormatter;
import java.util.Locale;

@Service
public class EmailService {
    
    private static final Logger logger = LoggerFactory.getLogger(EmailService.class);
    
    private final JavaMailSender mailSender;
    
    @Value("${app.email.from:noreply@industria.ma}")
    private String fromEmail;
    
    @Value("${app.email.admin:admin@industria.ma}")
    private String adminEmail;

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    public void sendContactConfirmationEmail(ContactRequest request) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail);
            helper.setTo(request.getContactEmail());
            helper.setSubject("Confirmation de votre demande de contact - Industria Platform");
            
            String htmlContent = buildConfirmationEmailContent(request);
            helper.setText(htmlContent, true);

            mailSender.send(message);
            logger.info("Email de confirmation envoyé à: {}", request.getContactEmail());
            
        } catch (MessagingException | MailException e) {
            logger.error("Erreur lors de l'envoi de l'email de confirmation à {}: {}", 
                        request.getContactEmail(), e.getMessage());
        }
    }

    public void sendAdminNotificationEmail(ContactRequest request) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail);
            helper.setTo(adminEmail);
            helper.setSubject("Nouvelle demande de contact - " + request.getContactType().getDisplayName());
            
            String htmlContent = buildAdminNotificationEmailContent(request);
            helper.setText(htmlContent, true);

            mailSender.send(message);
            logger.info("Email de notification admin envoyé pour la demande: {}", request.getId());
            
        } catch (MessagingException | MailException e) {
            logger.error("Erreur lors de l'envoi de l'email admin pour la demande {}: {}", 
                        request.getId(), e.getMessage());
        }
    }

    private String buildConfirmationEmailContent(ContactRequest request) {
        StringBuilder html = new StringBuilder();
        html.append("<!DOCTYPE html>")
            .append("<html lang='fr'>")
            .append("<head><meta charset='UTF-8'><title>Confirmation de demande</title></head>")
            .append("<body style='font-family: Arial, sans-serif; line-height: 1.6; color: #333;'>")
            .append("<div style='max-width: 600px; margin: 0 auto; padding: 20px;'>")
            .append("<h2 style='color: #2563eb;'>Confirmation de votre demande de contact</h2>")
            .append("<p>Bonjour ").append(request.getContactPrenom()).append(" ").append(request.getContactNom()).append(",</p>")
            .append("<p>Nous avons bien reçu votre demande de contact en tant que <strong>")
            .append(request.getContactType().getDisplayName()).append("</strong>.</p>")
            .append("<div style='background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;'>")
            .append("<h3 style='color: #1e40af; margin-top: 0;'>Récapitulatif de votre demande</h3>")
            .append("<p><strong>Raison sociale:</strong> ").append(request.getRaisonSociale()).append("</p>");

        if (request.getContactType().name().equals("AMENAGEUR")) {
            html.append("<p><strong>Région d'implantation:</strong> ").append(request.getRegionImplantation()).append("</p>")
                .append("<p><strong>Préfecture d'implantation:</strong> ").append(request.getPrefectureImplantation()).append("</p>")
                .append("<p><strong>Superficie nette:</strong> ").append(request.getSuperficieNetHa()).append(" Ha</p>")
                .append("<p><strong>Nombre de lots total:</strong> ").append(request.getNombreLotTotal()).append("</p>")
                .append("<p><strong>Nombre de lots non occupés:</strong> ").append(request.getNombreLotNonOccupe()).append("</p>");
        } else {
            html.append("<p><strong>Description de l'activité:</strong> ").append(request.getDescriptionActivite()).append("</p>");
            if (request.getMontantInvestissement() != null) {
                NumberFormat formatter = NumberFormat.getCurrencyInstance(new Locale("fr", "MA"));
                html.append("<p><strong>Montant d'investissement:</strong> ").append(formatter.format(request.getMontantInvestissement())).append("</p>");
            }
            html.append("<p><strong>Nombre d'emplois prévisionnels:</strong> ").append(request.getNombreEmploisPrevisionnel()).append("</p>")
                .append("<p><strong>Superficie souhaitée:</strong> ").append(request.getSuperficieSouhaitee()).append(" m²</p>")
                .append("<p><strong>Région d'implantation souhaitée:</strong> ").append(request.getRegionImplantationSouhaitee()).append("</p>");
        }

        html.append("</div>")
            .append("<p>Notre équipe étudiera votre demande et vous recontactera dans les plus brefs délais.</p>")
            .append("<p style='color: #64748b; font-size: 14px; margin-top: 30px;'>")
            .append("Cordialement,<br>L'équipe Industria Platform</p>")
            .append("</div></body></html>");

        return html.toString();
    }

    private String buildAdminNotificationEmailContent(ContactRequest request) {
        StringBuilder html = new StringBuilder();
        html.append("<!DOCTYPE html>")
            .append("<html lang='fr'>")
            .append("<head><meta charset='UTF-8'><title>Nouvelle demande de contact</title></head>")
            .append("<body style='font-family: Arial, sans-serif; line-height: 1.6; color: #333;'>")
            .append("<div style='max-width: 600px; margin: 0 auto; padding: 20px;'>")
            .append("<h2 style='color: #dc2626;'>Nouvelle demande de contact</h2>")
            .append("<div style='background-color: #fef2f2; padding: 20px; border-left: 4px solid #dc2626; margin: 20px 0;'>")
            .append("<p><strong>Type:</strong> ").append(request.getContactType().getDisplayName()).append("</p>")
            .append("<p><strong>Raison sociale:</strong> ").append(request.getRaisonSociale()).append("</p>")
            .append("<p><strong>Contact:</strong> ").append(request.getContactPrenom()).append(" ").append(request.getContactNom()).append("</p>")
            .append("<p><strong>Email:</strong> ").append(request.getContactEmail()).append("</p>")
            .append("<p><strong>Téléphone:</strong> ").append(request.getContactTelephone()).append("</p>")
            .append("</div>")
            .append("<div style='background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;'>")
            .append("<h3 style='color: #1e40af; margin-top: 0;'>Détails de la demande</h3>");

        if (request.getContactType().name().equals("AMENAGEUR")) {
            html.append("<p><strong>Région d'implantation:</strong> ").append(request.getRegionImplantation()).append("</p>")
                .append("<p><strong>Préfecture d'implantation:</strong> ").append(request.getPrefectureImplantation()).append("</p>")
                .append("<p><strong>Superficie nette:</strong> ").append(request.getSuperficieNetHa()).append(" Ha</p>")
                .append("<p><strong>Nombre de lots total:</strong> ").append(request.getNombreLotTotal()).append("</p>")
                .append("<p><strong>Nombre de lots non occupés:</strong> ").append(request.getNombreLotNonOccupe()).append("</p>");
        } else {
            html.append("<p><strong>Description de l'activité:</strong> ").append(request.getDescriptionActivite()).append("</p>");
            if (request.getMontantInvestissement() != null) {
                NumberFormat formatter = NumberFormat.getCurrencyInstance(new Locale("fr", "MA"));
                html.append("<p><strong>Montant d'investissement:</strong> ").append(formatter.format(request.getMontantInvestissement())).append("</p>");
            }
            html.append("<p><strong>Nombre d'emplois prévisionnels:</strong> ").append(request.getNombreEmploisPrevisionnel()).append("</p>")
                .append("<p><strong>Superficie souhaitée:</strong> ").append(request.getSuperficieSouhaitee()).append(" m²</p>")
                .append("<p><strong>Région d'implantation souhaitée:</strong> ").append(request.getRegionImplantationSouhaitee()).append("</p>");
        }

        html.append("</div>")
            .append("<p><strong>ID de la demande:</strong> ").append(request.getId()).append("</p>")
            .append("<p><strong>Date de création:</strong> ").append(request.getCreatedAt().toString()).append("</p>")
            .append("</div></body></html>");

        return html.toString();
    }

    // === MÉTHODES POUR LES RENDEZ-VOUS ===

    public void sendAppointmentConfirmationEmail(Appointment appointment) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail);
            helper.setTo(appointment.getContactEmail());
            helper.setSubject("Confirmation de votre demande de rendez-vous - Industria Platform");
            
            String htmlContent = buildAppointmentConfirmationEmailContent(appointment);
            helper.setText(htmlContent, true);

            mailSender.send(message);
            logger.info("Email de confirmation de RDV envoyé à: {}", appointment.getContactEmail());
            
        } catch (MessagingException | MailException e) {
            logger.error("Erreur lors de l'envoi de l'email de confirmation RDV à {}: {}", 
                        appointment.getContactEmail(), e.getMessage());
        }
    }

    public void sendAppointmentNotificationToZoneManager(Appointment appointment, User zoneManager) {
        if (zoneManager == null || zoneManager.getEmail() == null) {
            logger.warn("Aucun responsable de zone trouvé ou email manquant pour la notification RDV: {}", appointment.getId());
            return;
        }

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail);
            helper.setTo(zoneManager.getEmail());
            helper.setSubject("Nouveau rendez-vous - " + (appointment.getParcel() != null && appointment.getParcel().getZone() != null 
                             ? appointment.getParcel().getZone().getName() : "Zone inconnue"));
            
            String htmlContent = buildAppointmentNotificationEmailContent(appointment, zoneManager);
            helper.setText(htmlContent, true);

            mailSender.send(message);
            logger.info("Email de notification RDV envoyé au responsable: {}", zoneManager.getEmail());
            
        } catch (MessagingException | MailException e) {
            logger.error("Erreur lors de l'envoi de l'email de notification RDV au responsable {}: {}", 
                        zoneManager.getEmail(), e.getMessage());
        }
    }

    public void sendAppointmentStatusUpdateEmail(Appointment appointment, AppointmentStatus oldStatus) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail);
            helper.setTo(appointment.getContactEmail());
            helper.setSubject("Mise à jour de votre rendez-vous - Industria Platform");
            
            String htmlContent = buildAppointmentStatusUpdateEmailContent(appointment, oldStatus);
            helper.setText(htmlContent, true);

            mailSender.send(message);
            logger.info("Email de mise à jour de statut RDV envoyé à: {}", appointment.getContactEmail());
            
        } catch (MessagingException | MailException e) {
            logger.error("Erreur lors de l'envoi de l'email de mise à jour RDV à {}: {}", 
                        appointment.getContactEmail(), e.getMessage());
        }
    }

    private String buildAppointmentConfirmationEmailContent(Appointment appointment) {
        DateTimeFormatter dateFormatter = DateTimeFormatter.ofPattern("dd/MM/yyyy à HH:mm");
        
        StringBuilder html = new StringBuilder();
        html.append("<!DOCTYPE html>")
            .append("<html lang='fr'>")
            .append("<head><meta charset='UTF-8'><title>Confirmation de rendez-vous</title></head>")
            .append("<body style='font-family: Arial, sans-serif; line-height: 1.6; color: #333;'>")
            .append("<div style='max-width: 600px; margin: 0 auto; padding: 20px;'>")
            .append("<h2 style='color: #2563eb;'>Confirmation de votre demande de rendez-vous</h2>")
            .append("<p>Bonjour ").append(appointment.getContactName()).append(",</p>")
            .append("<p>Nous avons bien reçu votre demande de rendez-vous.</p>")
            .append("<div style='background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;'>")
            .append("<h3 style='color: #1e40af; margin-top: 0;'>Détails de votre demande</h3>");

        if (appointment.getParcel() != null) {
            html.append("<p><strong>Parcelle:</strong> ").append(appointment.getParcel().getReference() != null ? appointment.getParcel().getReference() : appointment.getParcel().getId()).append("</p>");
            if (appointment.getParcel().getZone() != null) {
                html.append("<p><strong>Zone:</strong> ").append(appointment.getParcel().getZone().getName()).append("</p>");
            }
            if (appointment.getParcel().getArea() != null) {
                html.append("<p><strong>Superficie:</strong> ").append(appointment.getParcel().getArea()).append(" m²</p>");
            }
        }

        if (appointment.getRequestedDate() != null) {
            html.append("<p><strong>Date souhaitée:</strong> ").append(appointment.getRequestedDate().format(dateFormatter)).append("</p>");
        }
        if (appointment.getCompanyName() != null && !appointment.getCompanyName().isEmpty()) {
            html.append("<p><strong>Société:</strong> ").append(appointment.getCompanyName()).append("</p>");
        }
        if (appointment.getMessage() != null && !appointment.getMessage().isEmpty()) {
            html.append("<p><strong>Message:</strong> ").append(appointment.getMessage()).append("</p>");
        }

        html.append("</div>")
            .append("<p>Notre équipe étudiera votre demande et vous recontactera dans les plus brefs délais pour confirmer le rendez-vous.</p>")
            .append("<p style='color: #64748b; font-size: 14px; margin-top: 30px;'>")
            .append("Cordialement,<br>L'équipe Industria Platform</p>")
            .append("</div></body></html>");

        return html.toString();
    }

    private String buildAppointmentNotificationEmailContent(Appointment appointment, User zoneManager) {
        DateTimeFormatter dateFormatter = DateTimeFormatter.ofPattern("dd/MM/yyyy à HH:mm");
        
        StringBuilder html = new StringBuilder();
        html.append("<!DOCTYPE html>")
            .append("<html lang='fr'>")
            .append("<head><meta charset='UTF-8'><title>Nouvelle demande de rendez-vous</title></head>")
            .append("<body style='font-family: Arial, sans-serif; line-height: 1.6; color: #333;'>")
            .append("<div style='max-width: 600px; margin: 0 auto; padding: 20px;'>")
            .append("<h2 style='color: #dc2626;'>Nouvelle demande de rendez-vous</h2>")
            .append("<p>Bonjour ").append(zoneManager.getName()).append(",</p>")
            .append("<p>Une nouvelle demande de rendez-vous a été enregistrée pour une parcelle dont vous êtes responsable.</p>")
            .append("<div style='background-color: #fef2f2; padding: 20px; border-left: 4px solid #dc2626; margin: 20px 0;'>")
            .append("<h3 style='color: #dc2626; margin-top: 0;'>Informations du demandeur</h3>")
            .append("<p><strong>Nom:</strong> ").append(appointment.getContactName()).append("</p>")
            .append("<p><strong>Email:</strong> ").append(appointment.getContactEmail()).append("</p>")
            .append("<p><strong>Téléphone:</strong> ").append(appointment.getContactPhone()).append("</p>");

        if (appointment.getCompanyName() != null && !appointment.getCompanyName().isEmpty()) {
            html.append("<p><strong>Société:</strong> ").append(appointment.getCompanyName()).append("</p>");
        }

        html.append("</div>")
            .append("<div style='background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;'>")
            .append("<h3 style='color: #1e40af; margin-top: 0;'>Détails de la demande</h3>");

        if (appointment.getParcel() != null) {
            html.append("<p><strong>Parcelle:</strong> ").append(appointment.getParcel().getReference() != null ? appointment.getParcel().getReference() : appointment.getParcel().getId()).append("</p>");
            if (appointment.getParcel().getZone() != null) {
                html.append("<p><strong>Zone:</strong> ").append(appointment.getParcel().getZone().getName()).append("</p>");
            }
        }

        if (appointment.getRequestedDate() != null) {
            html.append("<p><strong>Date souhaitée:</strong> ").append(appointment.getRequestedDate().format(dateFormatter)).append("</p>");
        }
        if (appointment.getMessage() != null && !appointment.getMessage().isEmpty()) {
            html.append("<p><strong>Message:</strong> ").append(appointment.getMessage()).append("</p>");
        }

        html.append("</div>")
            .append("<p><strong>ID de la demande:</strong> ").append(appointment.getId()).append("</p>")
            .append("<p>Veuillez traiter cette demande dans l'interface d'administration.</p>")
            .append("</div></body></html>");

        return html.toString();
    }

    private String buildAppointmentStatusUpdateEmailContent(Appointment appointment, AppointmentStatus oldStatus) {
        DateTimeFormatter dateFormatter = DateTimeFormatter.ofPattern("dd/MM/yyyy à HH:mm");
        
        StringBuilder html = new StringBuilder();
        html.append("<!DOCTYPE html>")
            .append("<html lang='fr'>")
            .append("<head><meta charset='UTF-8'><title>Mise à jour de votre rendez-vous</title></head>")
            .append("<body style='font-family: Arial, sans-serif; line-height: 1.6; color: #333;'>")
            .append("<div style='max-width: 600px; margin: 0 auto; padding: 20px;'>")
            .append("<h2 style='color: #2563eb;'>Mise à jour de votre rendez-vous</h2>")
            .append("<p>Bonjour ").append(appointment.getContactName()).append(",</p>")
            .append("<p>Le statut de votre demande de rendez-vous a été mis à jour.</p>")
            .append("<div style='background-color: #f0f9ff; padding: 20px; border-left: 4px solid #2563eb; margin: 20px 0;'>")
            .append("<h3 style='color: #1e40af; margin-top: 0;'>Changement de statut</h3>")
            .append("<p><strong>Ancien statut:</strong> ").append(getStatusLabel(oldStatus)).append("</p>")
            .append("<p><strong>Nouveau statut:</strong> ").append(getStatusLabel(appointment.getStatus())).append("</p>");

        if (appointment.getConfirmedDate() != null && appointment.getStatus() != null && appointment.getStatus().name().contains("CONFIRMED")) {
            html.append("<p><strong>Date confirmée:</strong> ").append(appointment.getConfirmedDate().format(dateFormatter)).append("</p>");
        }

        if (appointment.getNotes() != null && !appointment.getNotes().isEmpty()) {
            html.append("<p><strong>Notes:</strong> ").append(appointment.getNotes()).append("</p>");
        }

        html.append("</div>");

        if (appointment.getParcel() != null) {
            html.append("<div style='background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;'>")
                .append("<h3 style='color: #1e40af; margin-top: 0;'>Rappel des détails</h3>")
                .append("<p><strong>Parcelle:</strong> ").append(appointment.getParcel().getReference() != null ? appointment.getParcel().getReference() : appointment.getParcel().getId()).append("</p>");
            if (appointment.getParcel().getZone() != null) {
                html.append("<p><strong>Zone:</strong> ").append(appointment.getParcel().getZone().getName()).append("</p>");
            }
            html.append("</div>");
        }

        html.append("<p>Si vous avez des questions, n'hésitez pas à nous contacter.</p>")
            .append("<p style='color: #64748b; font-size: 14px; margin-top: 30px;'>")
            .append("Cordialement,<br>L'équipe Industria Platform</p>")
            .append("</div></body></html>");

        return html.toString();
    }

    private String getStatusLabel(AppointmentStatus status) {
        if (status == null) return "Non défini";
        return switch (status) {
            case PENDING -> "En attente";
            case CONFIRMED -> "Confirmé";
            case CANCELLED -> "Annulé";
            case COMPLETED -> "Terminé";
            default -> status.name();
        };
    }
}