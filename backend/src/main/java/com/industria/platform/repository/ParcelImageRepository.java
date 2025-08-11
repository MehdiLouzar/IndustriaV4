package com.industria.platform.repository;

import com.industria.platform.entity.ParcelImage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ParcelImageRepository extends JpaRepository<ParcelImage, String> {
    List<ParcelImage> findByParcelIdOrderByDisplayOrderAsc(String parcelId);
    
    List<ParcelImage> findByParcelIdOrderByIsPrimaryDescDisplayOrderAsc(String parcelId);
    
    Optional<ParcelImage> findByParcelIdAndIsPrimaryTrue(String parcelId);
    
    void deleteByParcelId(String parcelId);
    
    // Méthode JPA standard pour chercher par liste d'IDs
    List<ParcelImage> findByParcelIdInOrderByIsPrimaryDescDisplayOrderAsc(List<String> parcelIds);
    
    long countByParcelId(String parcelId);
}