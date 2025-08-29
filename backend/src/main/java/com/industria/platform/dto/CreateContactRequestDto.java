package com.industria.platform.dto;

import com.industria.platform.entity.ContactType;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;

/**
 * DTO pour la création d'une nouvelle demande de contact.
 * 
 * Utilisé pour valider et structurer les données saisies
 * dans le formulaire de contact du site web.
 * 
 * @author Industria Platform Team
 * @version 1.0
 * @since 1.0
 */
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