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
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    private String email;
    private String password;
    private String name;
    private String company;
    private String phone;

    @Enumerated(EnumType.STRING)
    private UserRole role;

    private Boolean isActive;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime deletedAt;

    @OneToMany(mappedBy = "createdBy")
    private Set<Zone> createdZones;

    @OneToMany(mappedBy = "createdBy")
    private Set<Parcel> createdParcels;

    @OneToMany(mappedBy = "managedBy")
    private Set<Appointment> appointments;

    @OneToMany(mappedBy = "user")
    private Set<AuditLog> auditLogs;
}
