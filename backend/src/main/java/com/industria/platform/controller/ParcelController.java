package com.industria.platform.controller;

import com.industria.platform.dto.ParcelDto;
import com.industria.platform.dto.VertexDto;
import com.industria.platform.entity.AuditAction;
import com.industria.platform.entity.Parcel;
import com.industria.platform.entity.ParcelStatus;
import com.industria.platform.entity.Zone;
import com.industria.platform.repository.ParcelRepository;
import com.industria.platform.repository.ZoneRepository;
import com.industria.platform.service.StatusService;
import com.industria.platform.service.GeometryUpdateService;
import com.industria.platform.service.PermissionService;
import com.industria.platform.service.UserService;
import com.industria.platform.service.AuditService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.ArrayList;
import org.springframework.data.domain.PageRequest;
import com.industria.platform.dto.ListResponse;

@RestController
@RequestMapping("/api/parcels")
public class ParcelController {

    private final StatusService statusService;
    private final ParcelRepository parcelRepository;
    private final ZoneRepository zoneRepository;
    private final GeometryUpdateService geometryUpdateService;
    private final PermissionService permissionService;
    private final UserService userService;
    private final AuditService auditService;

    public ParcelController(StatusService statusService,
                             ParcelRepository parcelRepository,
                             ZoneRepository zoneRepository,
                             GeometryUpdateService geometryUpdateService,
                             PermissionService permissionService,
                             UserService userService,
                             AuditService auditService) {
        this.statusService = statusService;
        this.parcelRepository = parcelRepository;
        this.zoneRepository = zoneRepository;
        this.geometryUpdateService = geometryUpdateService;
        this.permissionService = permissionService;
        this.userService = userService;
        this.auditService = auditService;
    }

    @GetMapping
    public ListResponse<ParcelDto> all(@RequestParam(required = false) String zoneId,
                                       @RequestParam(defaultValue = "1") int page,
                                       @RequestParam(defaultValue = "10") int limit,
                                       @RequestParam(required = false) String search) {
        int p = Math.max(1, page);
        int l = Math.min(Math.max(1, limit), 100);
        var pageable = PageRequest.of(p - 1, l);
        
        var res = (search != null && !search.trim().isEmpty()) 
            ? parcelRepository.findByReferenceContainingIgnoreCase(search.trim(), pageable)
            : (zoneId != null ?
                parcelRepository.findByZoneId(zoneId, pageable) :
                parcelRepository.findAll(pageable));
                
        var items = res.getContent().stream().map(this::toDto).toList();
        return new ListResponse<>(items, res.getTotalElements(), res.getTotalPages(), p, l);
    }

    @GetMapping("/all")
    public List<ParcelDto> allParcels() {
        List<Parcel> parcels = parcelRepository.findAll();
        
        // Filtrer selon les permissions pour les non-ADMIN
        if (!permissionService.hasRole("ADMIN")) {
            String currentUserEmail = userService.getCurrentUserEmail();
            parcels = parcels.stream()
                .filter(parcel -> parcel.getCreatedBy() != null && 
                              parcel.getCreatedBy().getEmail().equals(currentUserEmail))
                .toList();
        }
        
        return parcels.stream()
                .map(this::toDto)
                .toList();
    }

    @GetMapping("/{id}")
    public ParcelDto get(@PathVariable String id) {
        return parcelRepository.findById(id).map(this::toDto).orElse(null);
    }

    @PostMapping
    @PreAuthorize("hasRole('ZONE_MANAGER') or hasRole('ADMIN')")
    public ParcelDto create(@RequestBody ParcelDto dto) {
        // Vérifier si l'utilisateur peut modifier la zone parente
        if (dto.zoneId() != null && !permissionService.canModifyZone(dto.zoneId())) {
            throw new RuntimeException("Accès refusé : vous ne pouvez créer des parcelles que dans vos zones");
        }
        
        Parcel p = new Parcel();
        updateEntity(p, dto);
        
        // Définir automatiquement le créateur
        p.setCreatedBy(userService.getCurrentUser());
        
        parcelRepository.save(p);
        
        auditService.log(AuditAction.CREATE, "Parcel", p.getId(), 
            null, p, 
            "Création de la parcelle: " + p.getReference());
        
        return toDto(p);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ZONE_MANAGER') or hasRole('ADMIN')")
    public ResponseEntity<ParcelDto> update(@PathVariable String id, @RequestBody ParcelDto dto) {
        if (!permissionService.canModifyParcel(id)) {
            return ResponseEntity.status(403).build(); // Forbidden
        }
        
        Parcel oldParcel = parcelRepository.findById(id).orElseThrow();
        Parcel parcelClone = new Parcel();
        parcelClone.setReference(oldParcel.getReference());
        parcelClone.setArea(oldParcel.getArea());
        parcelClone.setStatus(oldParcel.getStatus());
        
        updateEntity(oldParcel, dto);
        parcelRepository.save(oldParcel);
        
        auditService.log(AuditAction.UPDATE, "Parcel", id, 
            parcelClone, oldParcel, 
            "Modification de la parcelle: " + oldParcel.getReference());
        
        return ResponseEntity.ok(toDto(oldParcel));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ZONE_MANAGER') or hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        if (!permissionService.canModifyParcel(id)) {
            return ResponseEntity.status(403).build(); // Forbidden
        }
        
        Parcel parcel = parcelRepository.findById(id).orElse(null);
        parcelRepository.deleteById(id);
        
        auditService.log(AuditAction.DELETE, "Parcel", id, 
            parcel, null, 
            "Suppression de la parcelle: " + (parcel != null ? parcel.getReference() : id));
        
        return ResponseEntity.ok().build();
    }

    @PutMapping("/{id}/status")
    @PreAuthorize("hasRole('ZONE_MANAGER') or hasRole('ADMIN')")
    public ResponseEntity<Parcel> updateStatus(@PathVariable String id, @RequestBody StatusRequest request) {
        if (!permissionService.canModifyParcel(id)) {
            return ResponseEntity.status(403).build(); // Forbidden
        }
        
        Parcel oldParcel = parcelRepository.findById(id).orElse(null);
        Parcel parcel = statusService.updateParcelStatus(id, request.status());
        
        auditService.log(AuditAction.UPDATE, "Parcel", id, 
            oldParcel != null ? oldParcel.getStatus() : null, 
            parcel.getStatus(), 
            "Changement de statut de la parcelle: " + parcel.getReference());
        
        return ResponseEntity.ok(parcel);
    }

    private ParcelDto toDto(Parcel p) {
        List<VertexDto> vertices = parseGeometry(p.getGeometry());
        return new ParcelDto(p.getId(), p.getReference(), p.getArea(),
                p.getStatus() == null ? null : p.getStatus().name(), p.getIsShowroom(),
                p.getZone() == null ? null : p.getZone().getId(),
                vertices, p.getLongitude(), p.getLatitude());
    }

    private void updateEntity(Parcel p, ParcelDto dto) {
        p.setReference(dto.reference());
        p.setArea(dto.area());
        if (dto.status() != null) p.setStatus(ParcelStatus.valueOf(dto.status()));
        p.setIsShowroom(dto.isShowroom());
        if (dto.zoneId() != null) {
            Zone z = zoneRepository.findById(dto.zoneId()).orElse(null);
            p.setZone(z);
        }
        
        // Préserver la géométrie existante si pas de nouveaux vertices
        if (dto.vertices() != null && !dto.vertices().isEmpty()) {
            String newGeometry = buildGeometry(dto.vertices());
            if (newGeometry != null) {
                p.setGeometry(newGeometry);
                p.setSrid(4326);
                
                System.out.println("DEBUG: Vertices reçus pour parcelle: " + dto.vertices());
                System.out.println("DEBUG: Nouvelle géométrie générée: " + newGeometry);
                // Calculer automatiquement les coordonnées WGS84
                geometryUpdateService.updateParcelCoordinates(p, dto.vertices());
            } else {
                System.out.println("DEBUG: Géométrie générée nulle, conservation de l'existante");
            }
        } else {
            System.out.println("DEBUG: Aucun vertex fourni, conservation de la géométrie existante");
            // Ne pas appeler geometryUpdateService pour éviter de réinitialiser les coordonnées
        }
    }
    
    private List<VertexDto> parseGeometry(String wkt) {
        if (wkt == null || wkt.trim().isEmpty()) return List.of();
        
        List<VertexDto> verts = new ArrayList<>();
        String[] parts = wkt.replaceAll("[^0-9. ]", "").trim().split("\\s+");
        for (int i = 0; i < parts.length - 1; i += 2) {
            verts.add(new VertexDto(i / 2, Double.parseDouble(parts[i]), Double.parseDouble(parts[i + 1])));
        }
        return verts;
    }

    private String buildGeometry(List<VertexDto> verts) {
        if (verts == null || verts.isEmpty()) return null;
        
        StringBuilder sb = new StringBuilder("POLYGON((");
        for (int i = 0; i < verts.size(); i++) {
            VertexDto v = verts.get(i);
            sb.append(v.lambertX()).append(" ").append(v.lambertY());
            if (i < verts.size() - 1) sb.append(", ");
        }
        // Fermer le polygone
        VertexDto first = verts.get(0);
        sb.append(", ").append(first.lambertX()).append(" ").append(first.lambertY());
        sb.append("))");
        return sb.toString();
    }

    public record StatusRequest(ParcelStatus status) {}
}
