package com.industria.platform.controller;

import com.industria.platform.dto.ContactRequestDto;
import com.industria.platform.dto.CreateContactRequestDto;
import com.industria.platform.dto.ListResponse;
import com.industria.platform.entity.*;
import com.industria.platform.repository.*;
import com.industria.platform.service.EmailService;
import com.industria.platform.service.AuditService;
import jakarta.validation.Valid;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/contact-requests")
public class ContactRequestController {

    private final ContactRequestRepository contactRequestRepository;
    private final ZoneRepository zoneRepository;
    private final ParcelRepository parcelRepository;
    private final EmailService emailService;
    private final AuditService auditService;

    public ContactRequestController(
            ContactRequestRepository contactRequestRepository,
            ZoneRepository zoneRepository,
            ParcelRepository parcelRepository,
            EmailService emailService,
            AuditService auditService) {
        this.contactRequestRepository = contactRequestRepository;
        this.zoneRepository = zoneRepository;
        this.parcelRepository = parcelRepository;
        this.emailService = emailService;
        this.auditService = auditService;
    }

    @PostMapping
    public ResponseEntity<ContactRequestDto> createContactRequest(@Valid @RequestBody CreateContactRequestDto dto) {
        try {
            ContactRequest contactRequest = new ContactRequest();
            updateEntityFromDto(contactRequest, dto);
            
            ContactRequest saved = contactRequestRepository.save(contactRequest);
            
            // Envoi des emails de confirmation et notification admin
            try {
                emailService.sendContactConfirmationEmail(saved);
                emailService.sendAdminNotificationEmail(saved);
            } catch (Exception e) {
                System.err.println("Erreur lors de l'envoi des emails: " + e.getMessage());
                // Ne pas faire échouer la demande si l'email échoue
            }
            
            auditService.log(AuditAction.CREATE, "ContactRequest", saved.getId(),
                null, saved,
                "Création d'une nouvelle demande de contact de type: " + saved.getContactType().getDisplayName());
            
            return ResponseEntity.ok(toDto(saved));
            
        } catch (Exception e) {
            System.err.println("Erreur lors de la création de la demande de contact: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).build();
        }
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ListResponse<ContactRequestDto> getAllContactRequests(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int limit,
            @RequestParam(required = false) ContactRequestStatus status,
            @RequestParam(required = false) ContactType contactType,
            @RequestParam(required = false) String search) {
        
        int p = Math.max(1, page);
        int l = Math.min(Math.max(1, limit), 100);
        Pageable pageable = PageRequest.of(p - 1, l);
        
        var result = contactRequestRepository.findWithFilters(status, contactType, search, pageable);
        var items = result.getContent().stream().map(this::toDto).toList();
        
        return new ListResponse<>(items, result.getTotalElements(), 
            result.getTotalPages(), p, l);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ContactRequestDto> getContactRequest(@PathVariable String id) {
        return contactRequestRepository.findById(id)
                .map(request -> ResponseEntity.ok(toDto(request)))
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ContactRequestDto> updateStatus(
            @PathVariable String id,
            @RequestBody UpdateStatusRequest request) {
        
        return contactRequestRepository.findById(id)
                .map(contactRequest -> {
                    ContactRequestStatus oldStatus = contactRequest.getStatus();
                    contactRequest.setStatus(request.status());
                    if (request.notes() != null) {
                        contactRequest.setNotes(request.notes());
                    }
                    
                    ContactRequest updated = contactRequestRepository.save(contactRequest);
                    
                    auditService.log(AuditAction.UPDATE, "ContactRequest", id,
                        oldStatus, updated.getStatus(),
                        "Changement de statut de la demande de contact: " + 
                        oldStatus + " -> " + updated.getStatus());
                    
                    return ResponseEntity.ok(toDto(updated));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteContactRequest(@PathVariable String id) {
        return contactRequestRepository.findById(id)
                .map(request -> {
                    contactRequestRepository.delete(request);
                    
                    auditService.log(AuditAction.DELETE, "ContactRequest", id,
                        request, null,
                        "Suppression de la demande de contact: " + request.getRaisonSociale());
                    
                    return ResponseEntity.ok().<Void>build();
                })
                .orElse(ResponseEntity.notFound().build());
    }

    // Endpoint public pour récupérer les régions du Maroc
    @GetMapping("/regions")
    public List<RegionOption> getRegions() {
        return List.of(
            new RegionOption("casablanca-settat", "Casablanca-Settat"),
            new RegionOption("rabat-sale-kenitra", "Rabat-Salé-Kénitra"),
            new RegionOption("fes-meknes", "Fès-Meknès"),
            new RegionOption("marrakech-safi", "Marrakech-Safi"),
            new RegionOption("oriental", "Oriental"),
            new RegionOption("tanger-tetouan-al-hoceima", "Tanger-Tétouan-Al Hoceïma"),
            new RegionOption("souss-massa", "Souss-Massa"),
            new RegionOption("draa-tafilalet", "Drâa-Tafilalet"),
            new RegionOption("beni-mellal-khenifra", "Béni Mellal-Khénifra"),
            new RegionOption("guelmim-oued-noun", "Guelmim-Oued Noun"),
            new RegionOption("laayoune-sakia-el-hamra", "Laâyoune-Sakia El Hamra"),
            new RegionOption("dakhla-oued-ed-dahab", "Dakhla-Oued Ed-Dahab")
        );
    }

    // Endpoint public pour récupérer les préfectures par région
    @GetMapping("/prefectures")
    public List<PrefectureOption> getPrefectures(@RequestParam String region) {
        return switch (region) {
            case "casablanca-settat" -> List.of(
                new PrefectureOption("casablanca", "Casablanca"),
                new PrefectureOption("mohammedia", "Mohammedia"),
                new PrefectureOption("el-jadida", "El Jadida"),
                new PrefectureOption("settat", "Settat"),
                new PrefectureOption("berrechid", "Berrechid"),
                new PrefectureOption("benslimane", "Benslimane"),
                new PrefectureOption("nouaceur", "Nouaceur"),
                new PrefectureOption("mediouna", "Mediouna"),
                new PrefectureOption("sidi-bennour", "Sidi Bennour")
            );
            case "rabat-sale-kenitra" -> List.of(
                new PrefectureOption("rabat", "Rabat"),
                new PrefectureOption("sale", "Salé"),
                new PrefectureOption("temara", "Témara"),
                new PrefectureOption("kenitra", "Kénitra"),
                new PrefectureOption("skhirat", "Skhirat-Témara"),
                new PrefectureOption("khemisset", "Khémisset"),
                new PrefectureOption("sidi-kacem", "Sidi Kacem"),
                new PrefectureOption("sidi-slimane", "Sidi Slimane")
            );
            case "fes-meknes" -> List.of(
                new PrefectureOption("fes", "Fès"),
                new PrefectureOption("meknes", "Meknès"),
                new PrefectureOption("taza", "Taza"),
                new PrefectureOption("sefrou", "Sefrou"),
                new PrefectureOption("boulemane", "Boulemane"),
                new PrefectureOption("taounate", "Taounate"),
                new PrefectureOption("moulay-yacoub", "Moulay Yacoub"),
                new PrefectureOption("el-hajeb", "El Hajeb"),
                new PrefectureOption("ifrane", "Ifrane")
            );
            case "marrakech-safi" -> List.of(
                new PrefectureOption("marrakech", "Marrakech"),
                new PrefectureOption("safi", "Safi"),
                new PrefectureOption("essaouira", "Essaouira"),
                new PrefectureOption("el-kelaa-des-sraghna", "El Kelâa des Sraghna"),
                new PrefectureOption("chichaoua", "Chichaoua"),
                new PrefectureOption("al-haouz", "Al Haouz"),
                new PrefectureOption("youssoufia", "Youssoufia"),
                new PrefectureOption("rehamna", "Rehamna")
            );
            case "oriental" -> List.of(
                new PrefectureOption("oujda-angad", "Oujda-Angad"),
                new PrefectureOption("nador", "Nador"),
                new PrefectureOption("berkane", "Berkane"),
                new PrefectureOption("taourirt", "Taourirt"),
                new PrefectureOption("jerada", "Jerada"),
                new PrefectureOption("driouch", "Driouch"),
                new PrefectureOption("guercif", "Guercif"),
                new PrefectureOption("figuig", "Figuig")
            );
            default -> List.of();
        };
    }

    private void updateEntityFromDto(ContactRequest entity, CreateContactRequestDto dto) {
        entity.setContactType(dto.contactType());
        entity.setRaisonSociale(dto.raisonSociale());
        entity.setContactNom(dto.contactNom());
        entity.setContactPrenom(dto.contactPrenom());
        entity.setContactTelephone(dto.contactTelephone());
        entity.setContactEmail(dto.contactEmail());
        
        // Champs aménageur
        entity.setRegionImplantation(dto.regionImplantation());
        entity.setPrefectureImplantation(dto.prefectureImplantation());
        entity.setSuperficieNetHa(dto.superficieNetHa());
        entity.setNombreLotTotal(dto.nombreLotTotal());
        entity.setNombreLotNonOccupe(dto.nombreLotNonOccupe());
        
        // Champs industriel/investisseur
        entity.setDescriptionActivite(dto.descriptionActivite());
        entity.setMontantInvestissement(dto.montantInvestissement());
        entity.setNombreEmploisPrevisionnel(dto.nombreEmploisPrevisionnel());
        entity.setSuperficieSouhaitee(dto.superficieSouhaitee());
        entity.setRegionImplantationSouhaitee(dto.regionImplantationSouhaitee());
        
        // Relations
        if (dto.zoneId() != null && !dto.zoneId().isEmpty()) {
            zoneRepository.findById(dto.zoneId()).ifPresent(entity::setZone);
        }
        if (dto.parcelId() != null && !dto.parcelId().isEmpty()) {
            parcelRepository.findById(dto.parcelId()).ifPresent(entity::setParcel);
        }
    }

    private ContactRequestDto toDto(ContactRequest entity) {
        return new ContactRequestDto(
            entity.getId(),
            entity.getContactType(),
            entity.getRaisonSociale(),
            entity.getContactNom(),
            entity.getContactPrenom(),
            entity.getContactTelephone(),
            entity.getContactEmail(),
            entity.getRegionImplantation(),
            entity.getPrefectureImplantation(),
            entity.getSuperficieNetHa(),
            entity.getNombreLotTotal(),
            entity.getNombreLotNonOccupe(),
            entity.getDescriptionActivite(),
            entity.getMontantInvestissement(),
            entity.getNombreEmploisPrevisionnel(),
            entity.getSuperficieSouhaitee(),
            entity.getRegionImplantationSouhaitee(),
            entity.getStatus(),
            entity.getNotes(),
            entity.getZone() != null ? entity.getZone().getId() : null,
            entity.getParcel() != null ? entity.getParcel().getId() : null,
            entity.getManagedBy() != null ? entity.getManagedBy().getId() : null,
            entity.getCreatedAt(),
            entity.getUpdatedAt()
        );
    }

    public record UpdateStatusRequest(ContactRequestStatus status, String notes) {}
    public record RegionOption(String value, String label) {}
    public record PrefectureOption(String value, String label) {}
}