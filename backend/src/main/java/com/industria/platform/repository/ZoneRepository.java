package com.industria.platform.repository;

import com.industria.platform.entity.Zone;
import com.industria.platform.entity.ZoneStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDateTime;
import java.util.List;

public interface ZoneRepository extends JpaRepository<Zone, String> {
    int countByCreatedById(String userId);
    
    Page<Zone> findByNameContainingIgnoreCaseOrAddressContainingIgnoreCase(
        String nameKeyword, String addressKeyword, Pageable pageable);
    
    // Méthode par défaut - les parcelles seront chargées via lazy loading
    default List<Zone> findAllWithParcelsAndCreators() {
        return findAll();
    }
    
    @Override
    List<Zone> findAll();
    
    // Méthodes pour les rapports
    long countByStatus(ZoneStatus status);
    long countByCreatedAtBetween(LocalDateTime start, LocalDateTime end);
    long countByRegionId(String regionId);
}
