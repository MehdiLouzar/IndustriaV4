package com.industria.platform.repository;

import com.industria.platform.entity.Parcel;
import com.industria.platform.entity.ParcelStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Set;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface ParcelRepository extends JpaRepository<Parcel, String> {
    Set<Parcel> findByZoneId(String zoneId);

    Page<Parcel> findByZoneId(String zoneId, Pageable pageable);

    int countByZoneIdAndStatus(String zoneId, ParcelStatus status);
}
