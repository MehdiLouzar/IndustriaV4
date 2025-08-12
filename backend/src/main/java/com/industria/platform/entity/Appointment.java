package com.industria.platform.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

/**
 * Entité représentant un rendez-vous d'investisseur.
 * 
 * Stocke les demandes de rendez-vous pour visiter des parcelles industrielles
 * avec informations de contact et détails du projet d'investissement.
 * 
 * @author Industria Platform Team
 * @version 1.0
 * @since 1.0
 */
@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Appointment {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    private String contactName;
    private String contactEmail;
    private String contactPhone;
    private String companyName;
    private String message;
    
    // Nouveaux champs ajoutés pour le formulaire amélioré
    private String activityType;
    private String projectDescription;
    private String investmentBudget;
    private String preferredDate;
    private String preferredTime;
    private String urgency;
    
    private LocalDateTime requestedDate;
    private LocalDateTime confirmedDate;

    @Enumerated(EnumType.STRING)
    private AppointmentStatus status;
    private String notes;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime deletedAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    @ManyToOne
    @JoinColumn(name = "parcel_id")
    private Parcel parcel;

    @ManyToOne
    @JoinColumn(name = "managed_by")
    private User managedBy;
}
