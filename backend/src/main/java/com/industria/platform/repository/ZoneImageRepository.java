package com.industria.platform.repository;

import com.industria.platform.entity.ZoneImage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ZoneImageRepository extends JpaRepository<ZoneImage, String> {
    List<ZoneImage> findByZoneIdOrderByDisplayOrderAsc(String zoneId);
    
    List<ZoneImage> findByZoneIdOrderByIsPrimaryDescDisplayOrderAsc(String zoneId);
    
    Optional<ZoneImage> findByZoneIdAndIsPrimaryTrue(String zoneId);
    
    void deleteByZoneId(String zoneId);
    
    // Méthode JPA standard pour chercher par liste d'IDs
    List<ZoneImage> findByZoneIdInOrderByIsPrimaryDescDisplayOrderAsc(List<String> zoneIds);
    
    long countByZoneId(String zoneId);
}