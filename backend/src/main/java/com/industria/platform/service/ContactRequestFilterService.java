package com.industria.platform.service;

import com.industria.platform.entity.ContactRequest;
import com.industria.platform.entity.ContactRequestStatus;
import com.industria.platform.entity.ContactType;
import com.industria.platform.repository.ContactRequestRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class ContactRequestFilterService {

    private final ContactRequestRepository contactRequestRepository;

    public ContactRequestFilterService(ContactRequestRepository contactRequestRepository) {
        this.contactRequestRepository = contactRequestRepository;
    }

    /**
     * Filtre les demandes de contact selon les critères fournis
     */
    public Page<ContactRequest> findWithFilters(ContactRequestStatus status,
                                               ContactType contactType,
                                               String search,
                                               Pageable pageable) {
        
        // Récupérer TOUTES les demandes de contact triées par date
        List<ContactRequest> allRequests = contactRequestRepository.findAll().stream()
            .sorted((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()))
            .collect(Collectors.toList());
        
        // Appliquer les filtres
        List<ContactRequest> filteredRequests = allRequests.stream()
            .filter(cr -> status == null || cr.getStatus() == status)
            .filter(cr -> contactType == null || cr.getContactType() == contactType)
            .filter(cr -> search == null || search.isEmpty() || 
                         matchesSearchCriteria(cr, search))
            .collect(Collectors.toList());
        
        // Calculer la pagination avec vérification des bornes
        int start = (int) pageable.getOffset();
        int end = Math.min((start + pageable.getPageSize()), filteredRequests.size());
        
        List<ContactRequest> pageContent = start < filteredRequests.size() ? 
            filteredRequests.subList(start, end) : List.of();
        
        return new PageImpl<>(pageContent, pageable, filteredRequests.size());
    }
    
    private boolean matchesSearchCriteria(ContactRequest cr, String search) {
        String searchLower = search.toLowerCase();
        
        return (cr.getRaisonSociale() != null && 
                cr.getRaisonSociale().toLowerCase().contains(searchLower)) ||
               (cr.getContactNom() != null && 
                cr.getContactNom().toLowerCase().contains(searchLower)) ||
               (cr.getContactEmail() != null && 
                cr.getContactEmail().toLowerCase().contains(searchLower));
    }
}