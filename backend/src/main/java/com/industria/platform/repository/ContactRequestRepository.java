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

/**
 * Repository pour la gestion des demandes de contact.
 * 
 * Fournit les opérations CRUD ainsi que des méthodes de recherche,
 * filtrage et statistiques pour les demandes de contact d'investisseurs
 * et d'aménageurs.
 * 
 * @author Industria Platform Team
 * @version 1.0
 * @since 1.0
 */
@Repository
public interface ContactRequestRepository extends JpaRepository<ContactRequest, String> {
    
    /**
     * Récupère les demandes de contact par statut, triées par date décroissante.
     *
     * @param status statut des demandes à rechercher
     * @param pageable paramètres de pagination
     * @return page de demandes avec le statut donné
     */
    Page<ContactRequest> findByStatusOrderByCreatedAtDesc(ContactRequestStatus status, Pageable pageable);
    
    /**
     * Récupère les demandes de contact par type, triées par date décroissante.
     *
     * @param contactType type de contact (INVESTISSEUR, AMENAGEUR)
     * @param pageable paramètres de pagination
     * @return page de demandes du type donné
     */
    Page<ContactRequest> findByContactTypeOrderByCreatedAtDesc(ContactType contactType, Pageable pageable);
    
    /**
     * Récupère toutes les demandes triées par date décroissante.
     * Méthode simplifiée - les filtres complexes sont gérés dans le service.
     *
     * @param pageable paramètres de pagination
     * @return page de toutes les demandes
     */
    Page<ContactRequest> findByOrderByCreatedAtDesc(Pageable pageable);
    
    /**
     * Recherche de demandes par critères textuels multiples.
     * Effectue une recherche insensible à la casse sur les champs principaux.
     *
     * @param raisonSociale terme de recherche pour la raison sociale
     * @param contactNom terme de recherche pour le nom de contact
     * @param contactEmail terme de recherche pour l'email de contact
     * @param pageable paramètres de pagination
     * @return page de demandes correspondant aux critères
     */
    Page<ContactRequest> findByRaisonSocialeContainingIgnoreCaseOrContactNomContainingIgnoreCaseOrContactEmailContainingIgnoreCaseOrderByCreatedAtDesc(
            String raisonSociale, String contactNom, String contactEmail, Pageable pageable);
    
    /**
     * Récupère les demandes avec un statut donné créées avant une date.
     * Utilisé pour le nettoyage automatique ou les relances.
     *
     * @param status statut des demandes
     * @param date date limite (exclusive)
     * @return liste des demandes anciennes avec ce statut
     */
    List<ContactRequest> findByStatusAndCreatedAtBefore(ContactRequestStatus status, LocalDateTime date);
    
    /**
     * Compte les demandes de contact par statut.
     * Utilisé pour les statistiques administratives.
     *
     * @param status statut à compter
     * @return nombre de demandes avec ce statut
     */
    long countByStatus(ContactRequestStatus status);
    
    /**
     * Compte les demandes de contact par type.
     * Utilisé pour les analyses de segmentation client.
     *
     * @param contactType type de contact à compter
     * @return nombre de demandes de ce type
     */
    long countByContactType(ContactType contactType);
}