package com.industria.platform.entity;

import jakarta.persistence.*;
import lombok.*;

/**
 * Entité de liaison entre Zone et Équipement.
 * 
 * Table de jointure pour la relation many-to-many entre les zones industrielles
 * et les équipements/services disponibles dans ces zones.
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
public class ZoneAmenity {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @ManyToOne
    @JoinColumn(name = "zone_id")
    private Zone zone;

    @ManyToOne
    @JoinColumn(name = "amenity_id")
    private Amenity amenity;
}
