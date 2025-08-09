package com.industria.platform.dto;

import com.industria.platform.entity.ContactType;
import com.industria.platform.entity.ContactRequestStatus;
import java.math.BigDecimal;
import java.time.LocalDateTime;

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