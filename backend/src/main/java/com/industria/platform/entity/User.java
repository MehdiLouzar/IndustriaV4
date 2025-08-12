package com.industria.platform.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.Set;

/**
 * Entité représentant un utilisateur de la plateforme.
 * 
 * Un utilisateur peut être un administrateur, un gestionnaire de zone ou un utilisateur standard.
 * Il peut créer des zones et des parcelles selon ses permissions.
 * 
 * @author Industria Platform Team
 * @version 1.0
 * @since 1.0
 */
@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {
    /** Identifiant unique de l'utilisateur */
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    /** Adresse email unique de l'utilisateur */
    @Column(unique = true, nullable = false)
    private String email;
    
    /** Mot de passe hashé de l'utilisateur */
    private String password;
    
    /** Nom complet de l'utilisateur */
    private String name;
    
    /** Nom de l'entreprise de l'utilisateur */
    private String company;
    
    /** Numéro de téléphone de l'utilisateur */
    private String phone;

    /** Rôle de l'utilisateur dans le système */
    @Enumerated(EnumType.STRING)
    private UserRole role;

    /** Date de création du compte */
    private LocalDateTime createdAt;
    
    /** Date de dernière mise à jour */
    private LocalDateTime updatedAt;
    
    /** Date de suppression (soft delete) */
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

    /** Zones créées par cet utilisateur */
    @OneToMany(mappedBy = "createdBy")
    private Set<Zone> createdZones;

    /** Parcelles créées par cet utilisateur */
    @OneToMany(mappedBy = "createdBy")
    private Set<Parcel> createdParcels;

    /** Rendez-vous gérés par cet utilisateur */
    @OneToMany(mappedBy = "managedBy")
    private Set<Appointment> appointments;

    /** Logs d'audit associés à cet utilisateur */
    @OneToMany(mappedBy = "user")
    private Set<AuditLog> auditLogs;
}
