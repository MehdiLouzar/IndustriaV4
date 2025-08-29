package com.industria.platform.entity;

import jakarta.persistence.*;
import lombok.*;

/**
 * Entité de liaison entre Parcelle et Équipement.
 * 
 * Table de jointure pour la relation many-to-many entre les parcelles
 * et les équipements/services disponibles dans ces parcelles.
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
public class ParcelAmenity {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @ManyToOne
    @JoinColumn(name = "parcel_id")
    private Parcel parcel;

    @ManyToOne
    @JoinColumn(name = "amenity_id")
    private Amenity amenity;
}
