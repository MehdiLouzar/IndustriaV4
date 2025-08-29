package com.industria.platform.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.math.BigDecimal;

/**
 * Entité représentant une demande de contact d'investisseur ou d'aménageur.
 * 
 * Cette entité stocke les informations saisies via le formulaire de contact
 * du site web, avec des champs spécialisés selon le type de demandeur.
 * 
 * Types de demandeurs :
 * - INVESTISSEUR : cherche à acquérir des parcelles
 * - AMENAGEUR : propose des zones à référencer sur la plateforme
 * 
 * @author Industria Platform Team
 * @version 1.0
 * @since 1.0
 */
@Entity
@Table(name = "contact_requests")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ContactRequest {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ContactType contactType;

    // Champs communs
    @Column(nullable = false)
    private String raisonSociale;

    @Column(nullable = false)
    private String contactNom;

    @Column(nullable = false)
    private String contactPrenom;

    @Column(nullable = false)
    private String contactTelephone;

    @Column(nullable = false)
    private String contactEmail;

    // Champs pour aménageur
    private String regionImplantation;
    private String prefectureImplantation;
    private Double superficieNetHa;
    private Integer nombreLotTotal;
    private Integer nombreLotNonOccupe;

    // Champs pour industriel/investisseur
    @Column(length = 100)
    private String descriptionActivite;
    private BigDecimal montantInvestissement;
    private Integer nombreEmploisPrevisionnel;
    private Double superficieSouhaitee;
    private String regionImplantationSouhaitee;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private ContactRequestStatus status = ContactRequestStatus.NOUVEAU;

    private String notes;

    @ManyToOne
    @JoinColumn(name = "zone_id")
    private Zone zone;

    @ManyToOne
    @JoinColumn(name = "parcel_id")
    private Parcel parcel;

    @ManyToOne
    @JoinColumn(name = "managed_by")
    private User managedBy;

    @Column(nullable = false)
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
}