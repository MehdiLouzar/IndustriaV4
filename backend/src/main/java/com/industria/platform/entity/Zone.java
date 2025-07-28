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
    private String geometry;

    private Integer srid;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime deletedAt;

    @OneToMany(mappedBy = "zone", cascade = CascadeType.ALL, orphanRemoval = true)
    private Set<Parcel> parcels;
}
