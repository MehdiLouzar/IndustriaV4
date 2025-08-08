package com.industria.platform.repository;

import com.industria.platform.entity.Zone;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface ZoneRepository extends JpaRepository<Zone, String> {
    int countByCreatedById(String userId);
    
    Page<Zone> findByNameContainingIgnoreCaseOrAddressContainingIgnoreCase(
        String nameKeyword, String addressKeyword, Pageable pageable);
    
    @Query("SELECT z FROM Zone z LEFT JOIN FETCH z.parcels")
    List<Zone> findAllWithParcels();
}
