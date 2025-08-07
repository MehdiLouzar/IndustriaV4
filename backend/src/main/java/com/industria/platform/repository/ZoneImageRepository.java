package com.industria.platform.repository;

import com.industria.platform.entity.ZoneImage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ZoneImageRepository extends JpaRepository<ZoneImage, String> {
    List<ZoneImage> findByZoneIdOrderByDisplayOrderAsc(String zoneId);
    
    List<ZoneImage> findByZoneIdOrderByIsPrimaryDescDisplayOrderAsc(String zoneId);
    
    Optional<ZoneImage> findByZoneIdAndIsPrimaryTrue(String zoneId);
    
    void deleteByZoneId(String zoneId);
    
    @Query("SELECT zi FROM ZoneImage zi WHERE zi.zone.id IN :zoneIds ORDER BY zi.isPrimary DESC, zi.displayOrder ASC")
    List<ZoneImage> findByZoneIdInOrderByIsPrimaryDescDisplayOrderAsc(List<String> zoneIds);
    
    long countByZoneId(String zoneId);
}