package com.industria.platform.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.Set;

/**
 * Entité représentant une parcelle industrielle.
 * 
 * Une parcelle est une subdivision d'une zone industrielle, avec ses propres
 * contraintes d'urbanisme et caractéristiques géospatiales.
 * 
 * @author Industria Platform Team
 * @version 1.0
 * @since 1.0
 */
@Entity
@Table(indexes = {@Index(columnList = "zone_id")})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Parcel {
    /** Identifiant unique de la parcelle */
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    /** Référence unique de la parcelle */
    private String reference;
    
    /** Superficie de la parcelle en mètres carrés */
    private Double area;

    /** Statut actuel de la parcelle */
    @Enumerated(EnumType.STRING)
    private ParcelStatus status;

    /** Indique si cette parcelle est un showroom */
    private Boolean isShowroom;
    
    /** Coefficient d'occupation du sol (COS) */
    private Double cos;
    
    /** Coefficient d'utilisation du sol (CUS) */
    private Double cus;
    
    /** Limite de hauteur en mètres */
    private Double heightLimit;
    
    /** Recul obligatoire en mètres */
    private Double setback;

    /** Géométrie de la parcelle au format WKT */
    @Column(columnDefinition = "text")
    @Convert(converter = com.industria.platform.converter.GeometryConverter.class)
    private String geometry;

    /** Système de référence spatiale (SRID) */
    private Integer srid;
    
    /** Longitude du centre de la parcelle (WGS84) */
    private Double longitude;
    
    /** Latitude du centre de la parcelle (WGS84) */
    private Double latitude;

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

    /** Zone parente contenant cette parcelle */
    @ManyToOne
    @JoinColumn(name = "zone_id")
    private Zone zone;

    /** Utilisateur qui a créé cette parcelle */
    @ManyToOne
    @JoinColumn(name = "created_by", referencedColumnName = "email")
    private User createdBy;

    /** Rendez-vous associés à cette parcelle */
    @OneToMany(mappedBy = "parcel")
    private Set<Appointment> appointments;

    /** Équipements disponibles sur cette parcelle */
    @OneToMany(mappedBy = "parcel")
    private Set<ParcelAmenity> amenities;

    /** Images associées à cette parcelle */
    @OneToMany(mappedBy = "parcel", cascade = CascadeType.ALL, orphanRemoval = true)
    private Set<ParcelImage> images;
}
