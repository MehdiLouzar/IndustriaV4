package com.industria.platform.dto;

import com.industria.platform.entity.ContactType;
import com.industria.platform.entity.ContactRequestStatus;
import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * DTO représentant une demande de contact d'investisseur ou d'aménageur.
 * 
 * Contient toutes les informations saisies via le formulaire de contact
 * avec des champs spécialisés selon le type de demandeur.
 * 
 * @author Industria Platform Team
 * @version 1.0
 * @since 1.0
 */
public record ContactRequestDto(
    String id,
    ContactType contactType,
    String raisonSociale,
    String contactNom,
    String contactPrenom,
    String contactTelephone,
    String contactEmail,
    
    // Champs aménageur
    String regionImplantation,
    String prefectureImplantation,
    Double superficieNetHa,
    Integer nombreLotTotal,
    Integer nombreLotNonOccupe,
    
    // Champs industriel/investisseur
    String descriptionActivite,
    BigDecimal montantInvestissement,
    Integer nombreEmploisPrevisionnel,
    Double superficieSouhaitee,
    String regionImplantationSouhaitee,
    
    ContactRequestStatus status,
    String notes,
    String zoneId,
    String parcelId,
    String managedByUserId,
    LocalDateTime createdAt,
    LocalDateTime updatedAt
) {}