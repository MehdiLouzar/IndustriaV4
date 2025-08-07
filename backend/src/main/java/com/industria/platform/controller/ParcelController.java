package com.industria.platform.controller;

import com.industria.platform.dto.ParcelDto;
import com.industria.platform.dto.VertexDto;
import com.industria.platform.entity.Parcel;
import com.industria.platform.entity.ParcelStatus;
import com.industria.platform.entity.Zone;
import com.industria.platform.repository.ParcelRepository;
import com.industria.platform.repository.ZoneRepository;
import com.industria.platform.service.StatusService;
import com.industria.platform.service.GeometryUpdateService;
import com.industria.platform.service.PermissionService;
import com.industria.platform.service.UserService;
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

    public ParcelController(StatusService statusService,
                             ParcelRepository parcelRepository,
                             ZoneRepository zoneRepository,
                             GeometryUpdateService geometryUpdateService,
                             PermissionService permissionService,
                             UserService userService) {
        this.statusService = statusService;
        this.parcelRepository = parcelRepository;
        this.zoneRepository = zoneRepository;
        this.geometryUpdateService = geometryUpdateService;
        this.permissionService = permissionService;
        this.userService = userService;
    }

    @GetMapping
    public ListResponse<ParcelDto> all(@RequestParam(required = false) String zoneId,
                                       @RequestParam(defaultValue = "1") int page,
                                       @RequestParam(defaultValue = "10") int limit) {
        int p = Math.max(1, page);
        int l = Math.min(Math.max(1, limit), 100);
        var pageable = PageRequest.of(p - 1, l);
        var res = zoneId != null ?
                parcelRepository.findByZoneId(zoneId, pageable) :
                parcelRepository.findAll(pageable);
        var items = res.getContent().stream().map(this::toDto).toList();
        return new ListResponse<>(items, res.getTotalElements(), res.getTotalPages(), p, l);
    }

    @GetMapping("/all")
    public List<ParcelDto> allParcels() {
        return parcelRepository.findAll()
                .stream()
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
        return toDto(p);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ZONE_MANAGER') or hasRole('ADMIN')")
    public ResponseEntity<ParcelDto> update(@PathVariable String id, @RequestBody ParcelDto dto) {
        if (!permissionService.canModifyParcel(id)) {
            return ResponseEntity.status(403).build(); // Forbidden
        }
        
        Parcel p = parcelRepository.findById(id).orElseThrow();
        updateEntity(p, dto);
        parcelRepository.save(p);
        return ResponseEntity.ok(toDto(p));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ZONE_MANAGER') or hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        if (!permissionService.canModifyParcel(id)) {
            return ResponseEntity.status(403).build(); // Forbidden
        }
        
        parcelRepository.deleteById(id);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/{id}/status")
    @PreAuthorize("hasRole('ZONE_MANAGER') or hasRole('ADMIN')")
    public ResponseEntity<Parcel> updateStatus(@PathVariable String id, @RequestBody StatusRequest request) {
        if (!permissionService.canModifyParcel(id)) {
            return ResponseEntity.status(403).build(); // Forbidden
        }
        
        Parcel parcel = statusService.updateParcelStatus(id, request.status());
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
        
        // Gestion de la géométrie
        if (dto.vertices() != null && !dto.vertices().isEmpty()) {
            p.setGeometry(buildGeometry(dto.vertices()));
            p.setSrid(4326);
            
            // Calculer automatiquement les coordonnées WGS84
            geometryUpdateService.updateParcelCoordinates(p, dto.vertices());
        } else {
            p.setGeometry(null);
            p.setSrid(null);
            p.setLongitude(null);
            p.setLatitude(null);
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
