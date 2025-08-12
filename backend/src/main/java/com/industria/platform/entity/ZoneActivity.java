package com.industria.platform.entity;

import jakarta.persistence.*;
import lombok.*;

/**
 * Entité de relation entre Zone et Activity.
 * 
 * Représente l'association many-to-many entre les zones industrielles
 * et les activités autorisées dans ces zones.
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
public class ZoneActivity {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @ManyToOne
    @JoinColumn(name = "zone_id")
    private Zone zone;

    @ManyToOne
    @JoinColumn(name = "activity_id")
    private Activity activity;
}
