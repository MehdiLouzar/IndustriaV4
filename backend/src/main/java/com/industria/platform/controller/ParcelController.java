package com.industria.platform.controller;

import com.industria.platform.dto.ParcelDto;
import com.industria.platform.dto.VertexDto;
import com.industria.platform.entity.AuditAction;
import com.industria.platform.entity.Parcel;
import com.industria.platform.entity.ParcelStatus;
import com.industria.platform.entity.User;
import com.industria.platform.entity.Zone;
import com.industria.platform.repository.ParcelRepository;
import com.industria.platform.repository.ZoneRepository;
import com.industria.platform.service.StatusService;
import com.industria.platform.service.GeometryUpdateService;
import com.industria.platform.service.PermissionService;
import com.industria.platform.service.UserService;
import com.industria.platform.service.AuditService;
import com.industria.platform.service.GeometryParsingService;
import com.industria.platform.service.PostGISGeometryService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.ArrayList;
import java.util.Optional;
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
    private final GeometryParsingService geometryParsingService;
    private final PostGISGeometryService postGISGeometryService;

    public ParcelController(StatusService statusService,
                             ParcelRepository parcelRepository,
                             ZoneRepository zoneRepository,
                             GeometryUpdateService geometryUpdateService,
                             PermissionService permissionService,
                             UserService userService,
                             AuditService auditService,
                             GeometryParsingService geometryParsingService,
                             PostGISGeometryService postGISGeometryService) {
        this.statusService = statusService;
        this.parcelRepository = parcelRepository;
        this.zoneRepository = zoneRepository;
        this.geometryUpdateService = geometryUpdateService;
        this.permissionService = permissionService;
        this.userService = userService;
        this.auditService = auditService;
        this.geometryParsingService = geometryParsingService;
        this.postGISGeometryService = postGISGeometryService;
    }

    @GetMapping
    public ListResponse<ParcelDto> all(@RequestParam(required = false) String zoneId,
                                       @RequestParam(defaultValue = "1") int page,
                                       @RequestParam(defaultValue = "10") int limit,
                                       @RequestParam(required = false) String search) {
        int p = Math.max(1, page);
        int l = Math.min(Math.max(1, limit), 100);
        
        // Récupérer TOUTES les parcelles selon les critères (pas de pagination initiale)
        List<Parcel> allParcels;
        
        if (search != null && !search.trim().isEmpty()) {
            // Recherche par référence - récupérer toutes qui correspondent
            var searchPageable = PageRequest.of(0, 10000); // Limite raisonnable
            allParcels = parcelRepository.findByReferenceContainingIgnoreCase(search.trim(), searchPageable).getContent();
        } else if (zoneId != null) {
            // Filtrer par zone - récupérer toutes de cette zone
            allParcels = new ArrayList<>(parcelRepository.findByZoneId(zoneId));
        } else {
            // Récupérer toutes les parcelles
            allParcels = parcelRepository.findAll();
        }
        
        System.out.println("DEBUG - Found " + allParcels.size() + " parcels before filtering");
        
        // Filtrer selon les permissions seulement pour les ZONE_MANAGER connectés
        List<Parcel> permissionFilteredParcels;
        try {
            if (permissionService.hasRole("ZONE_MANAGER")) {
                // ZONE_MANAGER voit seulement ses parcelles
                String currentUserEmail = userService.getCurrentUserEmail();
                permissionFilteredParcels = allParcels.stream()
                    .filter(parcel -> parcel.getCreatedBy() != null && 
                                  parcel.getCreatedBy().getEmail().equals(currentUserEmail))
                    .toList();
            } else {
                // ADMIN et utilisateurs non connectés voient toutes les parcelles
                permissionFilteredParcels = allParcels;
            }
        } catch (Exception e) {
            // Utilisateur non connecté - voir toutes les parcelles
            permissionFilteredParcels = allParcels;
        }
        
        System.out.println("DEBUG - After permission filtering: " + permissionFilteredParcels.size() + " parcels");
        
        // MAINTENANT appliquer la pagination sur les résultats filtrés
        long totalFiltered = permissionFilteredParcels.size();
        int totalPagesFiltered = (int) Math.ceil((double) totalFiltered / l);
        
        int startIndex = (p - 1) * l;
        int endIndex = Math.min(startIndex + l, (int) totalFiltered);
        
        List<Parcel> paginatedParcels = startIndex < totalFiltered ? 
            permissionFilteredParcels.subList(startIndex, endIndex) : List.of();
                
        var items = paginatedParcels.stream().map(this::toDto).toList();
        return new ListResponse<>(items, totalFiltered, totalPagesFiltered, p, l);
    }

    @GetMapping("/all")
    public List<ParcelDto> allParcels() {
        List<Parcel> parcels = parcelRepository.findAll();
        
        // Filtrer selon les permissions seulement pour les ZONE_MANAGER connectés
        try {
            if (permissionService.hasRole("ZONE_MANAGER")) {
                // ZONE_MANAGER voit seulement ses parcelles
                String currentUserEmail = userService.getCurrentUserEmail();
                parcels = parcels.stream()
                    .filter(parcel -> parcel.getCreatedBy() != null && 
                                  parcel.getCreatedBy().getEmail().equals(currentUserEmail))
                    .toList();
            }
            // ADMIN et utilisateurs non connectés voient toutes les parcelles
        } catch (Exception e) {
            // Utilisateur non connecté - voir toutes les parcelles (pas de filtrage)
        }
        // ADMIN voit toutes les parcelles (pas de filtrage)
        
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
        User currentUser = userService.getCurrentUser();
        if (currentUser != null) {
            p.setCreatedBy(currentUser);
        } else {
            throw new RuntimeException("Utilisateur non authentifié : impossible de créer une parcelle");
        }
        
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
        List<VertexDto> vertices = List.of();
        
        // Récupérer la géométrie - d'abord essayer depuis l'entity, puis via PostGIS service
        try {
            String geometry = p.getGeometry();
            System.out.println("DEBUG - Parcel " + p.getId() + " geometry: " + (geometry != null ? geometry.substring(0, Math.min(100, geometry.length())) + "..." : "null"));
            
            if (geometry != null && !geometry.trim().isEmpty()) {
                vertices = geometryParsingService.parseWKTGeometry(geometry);
                System.out.println("DEBUG - Parcel " + p.getId() + " parsed " + vertices.size() + " vertices via entity");
                if (!vertices.isEmpty()) {
                    System.out.println("DEBUG - First vertex: (" + vertices.get(0).lambertX() + ", " + vertices.get(0).lambertY() + ")");
                }
            } else {
                // Fallback: essayer via PostGIS service
                System.out.println("DEBUG - Parcel " + p.getId() + " trying PostGIS service fallback");
                vertices = postGISGeometryService.extractParcelVertices(p.getId());
                System.out.println("DEBUG - Parcel " + p.getId() + " parsed " + vertices.size() + " vertices via PostGIS");
                if (!vertices.isEmpty()) {
                    System.out.println("DEBUG - First vertex from PostGIS: (" + vertices.get(0).lambertX() + ", " + vertices.get(0).lambertY() + ")");
                }
            }
        } catch (Exception e) {
            System.err.println("Error parsing parcel geometry for " + p.getId() + ": " + e.getMessage());
            e.printStackTrace();
        }
        
        return new ParcelDto(p.getId(), p.getReference(), p.getArea(),
                p.getStatus() == null ? null : p.getStatus().name(), p.getIsShowroom(),
                p.getZone() == null ? null : p.getZone().getId(),
                vertices, p.getLongitude(), p.getLatitude(),
                p.getCos(), p.getCus(), p.getHeightLimit(), p.getSetback(),
                p.getZone() == null ? null : p.getZone().getName(),
                p.getZone() == null ? null : p.getZone().getAddress(),
                p.getZone() == null ? null : p.getZone().getPrice(),
                p.getZone() == null ? null : (p.getZone().getPriceType() == null ? null : p.getZone().getPriceType().name()));
    }

    private void updateEntity(Parcel p, ParcelDto dto) {
        p.setReference(dto.reference());
        p.setArea(dto.area());
        if (dto.status() != null) p.setStatus(ParcelStatus.valueOf(dto.status()));
        p.setIsShowroom(dto.isShowroom());
        
        // Ajouter les contraintes techniques
        p.setCos(dto.cos());
        p.setCus(dto.cus());
        p.setHeightLimit(dto.heightLimit());
        p.setSetback(dto.setback());
        
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
        
        System.out.println("DEBUG: Parsing WKT: " + wkt);
        
        // Extraire les coordonnées du POLYGON((x1 y1, x2 y2, ...))
        String coords = wkt;
        if (coords.startsWith("POLYGON((")) {
            coords = coords.substring(9); // Remove "POLYGON(("
        }
        if (coords.endsWith("))")) {
            coords = coords.substring(0, coords.length() - 2); // Remove "))"
        }
        
        System.out.println("DEBUG: Extracted coords: " + coords);
        
        List<VertexDto> verts = new ArrayList<>();
        String[] coordPairs = coords.split(",");
        
        for (int i = 0; i < coordPairs.length; i++) {
            String[] xy = coordPairs[i].trim().split("\\s+");
            if (xy.length >= 2) {
                double x = Double.parseDouble(xy[0]);
                double y = Double.parseDouble(xy[1]);
                
                // Éviter de dupliquer le premier point (qui ferme le polygone)
                if (i == coordPairs.length - 1 && verts.size() > 0) {
                    VertexDto firstVertex = verts.get(0);
                    if (Math.abs(firstVertex.lambertX() - x) < 0.001 && Math.abs(firstVertex.lambertY() - y) < 0.001) {
                        break; // Skip the closing duplicate point
                    }
                }
                
                verts.add(new VertexDto(i, x, y));
            }
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
