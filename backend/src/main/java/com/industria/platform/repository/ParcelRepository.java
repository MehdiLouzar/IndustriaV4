package com.industria.platform.repository;

import com.industria.platform.entity.Parcel;
import com.industria.platform.entity.ParcelStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Set;
import java.util.List;
import java.time.LocalDateTime;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface ParcelRepository extends JpaRepository<Parcel, String> {
    Set<Parcel> findByZoneId(String zoneId);

    Page<Parcel> findByZoneId(String zoneId, Pageable pageable);
    
    Page<Parcel> findByReferenceContainingIgnoreCase(String reference, Pageable pageable);

    int countByZoneId(String zoneId);
    
    int countByZoneIdAndStatus(String zoneId, ParcelStatus status);
    
    long countByStatus(ParcelStatus status);
    
    List<Parcel> findByCreatedById(String createdById);
    
    // Méthodes pour les rapports
    long countByZone_RegionId(String regionId);
}
