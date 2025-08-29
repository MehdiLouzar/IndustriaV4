package com.industria.platform.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.Set;

/**
 * Entité représentant une zone industrielle.
 * 
 * Une zone est un territoire géographique délimité pouvant contenir plusieurs parcelles.
 * Elle possède des informations géospatiales, des activités autorisées et des équipements.
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
public class Zone {
    /** Identifiant unique de la zone */
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    /** Nom de la zone */
    private String name;
    
    /** Description détaillée de la zone */
    private String description;
    
    /** Adresse physique de la zone */
    private String address;
    
    /** Superficie totale de la zone en mètres carrés */
    private Double totalArea;
    
    /** Prix de base de la zone */
    private Double price;

    /** Type de tarification (par mètre carré, forfaitaire, etc.) */
    @Enumerated(EnumType.STRING)
    private PriceType priceType;

    /** Type de construction autorisé dans la zone */
    @Enumerated(EnumType.STRING)
    private ConstructionType constructionType;

    /** Statut actuel de la zone */
    @Enumerated(EnumType.STRING)
    private ZoneStatus status;

    /** Géométrie de la zone au format WKT */
    @Column(columnDefinition = "text")
    @Convert(converter = com.industria.platform.converter.GeometryConverter.class)
    private String geometry;

    /** Système de référence spatiale (SRID) */
    private Integer srid;
    
    /** Longitude du centre de la zone (WGS84) */
    private Double longitude;
    
    /** Latitude du centre de la zone (WGS84) */
    private Double latitude;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime deletedAt;
    
    /**
     * Callback exécuté avant la persistance initiale.
     * Initialise les dates de création et mise à jour.
     */
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    /**
     * Callback exécuté avant chaque mise à jour.
     * Met à jour la date de modification.
     */
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    /** Parcelles contenues dans cette zone */
    @OneToMany(mappedBy = "zone", cascade = CascadeType.ALL, orphanRemoval = true)
    private Set<Parcel> parcels;

    /** Type de zone (industrielle, commerciale, etc.) */
    @ManyToOne
    @JoinColumn(name = "zone_type_id")
    private ZoneType zoneType;

    /** Région géographique où se trouve la zone */
    @ManyToOne
    @JoinColumn(name = "region_id")
    private Region region;

    /** Utilisateur qui a créé cette zone */
    @ManyToOne
    @JoinColumn(name = "created_by", referencedColumnName = "email")
    private User createdBy;

    /** Activités autorisées dans cette zone */
    @OneToMany(mappedBy = "zone", cascade = CascadeType.ALL, orphanRemoval = true)
    private Set<ZoneActivity> activities;

    /** Équipements disponibles dans cette zone */
    @OneToMany(mappedBy = "zone", cascade = CascadeType.ALL, orphanRemoval = true)
    private Set<ZoneAmenity> amenities;

    /** Images associées à cette zone */
    @OneToMany(mappedBy = "zone", cascade = CascadeType.ALL, orphanRemoval = true)
    private Set<ZoneImage> images;
}
