package com.industria.platform.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.Set;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Zone {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    private String name;
    private String description;
    private String address;
    private Double totalArea;
    private Double price;

    @Enumerated(EnumType.STRING)
    private PriceType priceType;

    @Enumerated(EnumType.STRING)
    private ConstructionType constructionType;

    @Enumerated(EnumType.STRING)
    private ZoneStatus status;

    @Column(columnDefinition = "text")
    @Convert(converter = com.industria.platform.converter.GeometryConverter.class)
    private String geometry;

    private Integer srid;
    
    // Coordonnées calculées automatiquement à partir des vertices
    private Double longitude;
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

    @OneToMany(mappedBy = "zone", cascade = CascadeType.ALL, orphanRemoval = true)
    private Set<Parcel> parcels;

    @ManyToOne
    @JoinColumn(name = "zone_type_id")
    private ZoneType zoneType;

    @ManyToOne
    @JoinColumn(name = "region_id")
    private Region region;

    @ManyToOne
    @JoinColumn(name = "created_by", referencedColumnName = "email")
    private User createdBy;

    @OneToMany(mappedBy = "zone")
    private Set<ZoneActivity> activities;

    @OneToMany(mappedBy = "zone")
    private Set<ZoneAmenity> amenities;

    @OneToMany(mappedBy = "zone", cascade = CascadeType.ALL, orphanRemoval = true)
    private Set<ZoneImage> images;
}
