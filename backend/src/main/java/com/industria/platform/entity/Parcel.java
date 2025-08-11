package com.industria.platform.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.Set;

@Entity
@Table(indexes = {@Index(columnList = "zone_id")})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Parcel {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    private String reference;
    private Double area;

    @Enumerated(EnumType.STRING)
    private ParcelStatus status;

    private Boolean isShowroom;
    private Double cos;
    private Double cus;
    private Double heightLimit;
    private Double setback;

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

    @ManyToOne
    @JoinColumn(name = "zone_id")
    private Zone zone;

    @ManyToOne
    @JoinColumn(name = "created_by", referencedColumnName = "email")
    private User createdBy;

    @OneToMany(mappedBy = "parcel")
    private Set<Appointment> appointments;

    @OneToMany(mappedBy = "parcel")
    private Set<ParcelAmenity> amenities;

    @OneToMany(mappedBy = "parcel", cascade = CascadeType.ALL, orphanRemoval = true)
    private Set<ParcelImage> images;
}
