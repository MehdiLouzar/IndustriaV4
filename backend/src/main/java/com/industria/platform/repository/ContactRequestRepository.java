package com.industria.platform.repository;

import com.industria.platform.entity.ContactRequest;
import com.industria.platform.entity.ContactRequestStatus;
import com.industria.platform.entity.ContactType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ContactRequestRepository extends JpaRepository<ContactRequest, String> {
    
    Page<ContactRequest> findByStatusOrderByCreatedAtDesc(ContactRequestStatus status, Pageable pageable);
    
    Page<ContactRequest> findByContactTypeOrderByCreatedAtDesc(ContactType contactType, Pageable pageable);
    
    @Query("SELECT cr FROM ContactRequest cr WHERE " +
           "(:status IS NULL OR cr.status = :status) AND " +
           "(:contactType IS NULL OR cr.contactType = :contactType) AND " +
           "(:search IS NULL OR LOWER(cr.raisonSociale) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           " LOWER(cr.contactNom) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           " LOWER(cr.contactEmail) LIKE LOWER(CONCAT('%', :search, '%'))) " +
           "ORDER BY cr.createdAt DESC")
    Page<ContactRequest> findWithFilters(@Param("status") ContactRequestStatus status,
                                       @Param("contactType") ContactType contactType,
                                       @Param("search") String search,
                                       Pageable pageable);
    
    List<ContactRequest> findByStatusAndCreatedAtBefore(ContactRequestStatus status, LocalDateTime date);
    
    long countByStatus(ContactRequestStatus status);
    
    long countByContactType(ContactType contactType);
}