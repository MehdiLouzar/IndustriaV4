package com.industria.platform.repository;

import com.industria.platform.entity.Parcel;
import com.industria.platform.entity.ParcelStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Set;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface ParcelRepository extends JpaRepository<Parcel, String> {
    Set<Parcel> findByZoneId(String zoneId);

    Page<Parcel> findByZoneId(String zoneId, Pageable pageable);
    
    Page<Parcel> findByReferenceContainingIgnoreCase(String reference, Pageable pageable);

    int countByZoneId(String zoneId);
    
    int countByZoneIdAndStatus(String zoneId, ParcelStatus status);
    
    long countByStatus(ParcelStatus status);
    
    @Query(value = "SELECT ST_AsText(geometry) FROM parcel WHERE id = :parcelId", nativeQuery = true)
    Optional<String> findGeometryAsText(@Param("parcelId") String parcelId);
    
    List<Parcel> findByCreatedById(String createdById);
}
