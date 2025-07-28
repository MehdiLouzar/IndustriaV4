package com.industria.platform.repository;

import com.industria.platform.entity.Parcel;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Set;

public interface ParcelRepository extends JpaRepository<Parcel, String> {
    Set<Parcel> findByZoneId(String zoneId);
}
