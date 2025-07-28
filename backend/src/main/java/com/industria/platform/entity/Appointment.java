package com.industria.platform.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Appointment {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    private String contactName;
    private String contactEmail;
    private String contactPhone;
    private String companyName;
    private String message;
    private LocalDateTime requestedDate;
    private LocalDateTime confirmedDate;

    @Enumerated(EnumType.STRING)
    private AppointmentStatus status;
    private String notes;
    private Boolean isActive;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime deletedAt;

    @ManyToOne
    @JoinColumn(name = "parcel_id")
    private Parcel parcel;

    @ManyToOne
    @JoinColumn(name = "managed_by")
    private User managedBy;
}
