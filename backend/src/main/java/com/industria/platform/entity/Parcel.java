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
    private String geometry;

    private Integer srid;
    
    // Coordonnées calculées automatiquement à partir des vertices
    private Double longitude;
    private Double latitude;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime deletedAt;

    @ManyToOne
    @JoinColumn(name = "zone_id")
    private Zone zone;

    @ManyToOne
    @JoinColumn(name = "created_by")
    private User createdBy;

    @OneToMany(mappedBy = "parcel")
    private Set<Appointment> appointments;

    @OneToMany(mappedBy = "parcel")
    private Set<ParcelAmenity> amenities;
}
