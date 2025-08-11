package com.industria.platform.repository;

import com.industria.platform.entity.ContactRequest;
import com.industria.platform.entity.ContactRequestStatus;
import com.industria.platform.entity.ContactType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ContactRequestRepository extends JpaRepository<ContactRequest, String> {
    
    Page<ContactRequest> findByStatusOrderByCreatedAtDesc(ContactRequestStatus status, Pageable pageable);
    
    Page<ContactRequest> findByContactTypeOrderByCreatedAtDesc(ContactType contactType, Pageable pageable);
    
    // Méthode simplifiée - les filtres complexes seront gérés dans le service
    Page<ContactRequest> findByOrderByCreatedAtDesc(Pageable pageable);
    
    Page<ContactRequest> findByRaisonSocialeContainingIgnoreCaseOrContactNomContainingIgnoreCaseOrContactEmailContainingIgnoreCaseOrderByCreatedAtDesc(
            String raisonSociale, String contactNom, String contactEmail, Pageable pageable);
    
    List<ContactRequest> findByStatusAndCreatedAtBefore(ContactRequestStatus status, LocalDateTime date);
    
    long countByStatus(ContactRequestStatus status);
    
    long countByContactType(ContactType contactType);
}