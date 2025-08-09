package com.industria.platform.dto;

import com.industria.platform.entity.ContactType;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;

public record CreateContactRequestDto(
    @NotNull
    ContactType contactType,
    
    @NotBlank
    @Size(max = 255)
    String raisonSociale,
    
    @NotBlank
    @Size(max = 100)
    String contactNom,
    
    @NotBlank
    @Size(max = 100)
    String contactPrenom,
    
    @NotBlank
    @Size(max = 20)
    String contactTelephone,
    
    @NotBlank
    @Email
    @Size(max = 255)
    String contactEmail,
    
    // Champs aménageur
    String regionImplantation,
    String prefectureImplantation,
    @Positive
    Double superficieNetHa,
    @Positive
    Integer nombreLotTotal,
    @PositiveOrZero
    Integer nombreLotNonOccupe,
    
    // Champs industriel/investisseur
    @Size(max = 1000)
    String descriptionActivite,
    @Positive
    BigDecimal montantInvestissement,
    @Positive
    Integer nombreEmploisPrevisionnel,
    @Positive
    Double superficieSouhaitee,
    String regionImplantationSouhaitee,
    
    String zoneId,
    String parcelId
) {}