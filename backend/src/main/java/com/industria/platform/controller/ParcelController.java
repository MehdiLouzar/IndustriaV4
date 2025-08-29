package com.industria.platform.controller;

import com.industria.platform.dto.ListResponse;
import com.industria.platform.dto.ParcelDto;
import com.industria.platform.dto.ParcelImageDto;
import com.industria.platform.dto.VertexDto;
import com.industria.platform.entity.AuditAction;
import com.industria.platform.entity.Parcel;
import com.industria.platform.entity.ParcelStatus;
import com.industria.platform.entity.User;
import com.industria.platform.entity.Zone;
import com.industria.platform.repository.ParcelRepository;
import com.industria.platform.repository.ZoneRepository;
import com.industria.platform.service.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;

/**
 * Contrôleur REST pour la gestion des parcelles.
 *
 * @author Industria Platform Team
 * @version 1.0
 * @since 1.0
 */
@RestController
@RequestMapping("/api/parcels")
@RequiredArgsConstructor
@Slf4j
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

    @GetMapping
    public ListResponse<ParcelDto> all(@RequestParam(required = false) String zoneId,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int limit,
            @RequestParam(required = false) String search) {
        int p = Math.max(1, page);
        int l = Math.min(Math.max(1, limit), 100);

        List<Parcel> allParcels;

        if (search != null && !search.trim().isEmpty()) {
            var searchPageable = PageRequest.of(0, 10000);
            allParcels = parcelRepository
                    .findByReferenceContainingIgnoreCase(search.trim(), searchPageable)
                    .getContent();
        } else if (zoneId != null) {
            allParcels = new ArrayList<>(parcelRepository.findByZoneId(zoneId));
        } else {
            allParcels = parcelRepository.findAll();
        }

        log.debug("Found {} parcels before filtering", allParcels.size());

        // Filter for ZONE_MANAGER: only their own parcels, by creator ID (not email)
        List<Parcel> permissionFilteredParcels;
        if (permissionService.hasRole("ZONE_MANAGER")) {
            String currentUserId = userService.findCurrentUser()
                    .map(User::getId)
                    .orElse(null);

            if (currentUserId == null) {
                // No user loaded; safest is to return empty for a manager
                permissionFilteredParcels = List.of();
            } else {
                permissionFilteredParcels = allParcels.stream()
                        .filter(parcel -> parcel.getCreatedBy() != null
                                && currentUserId.equals(parcel.getCreatedBy().getId()))
                        .toList();
            }
        } else {
            // ADMIN and public users see all parcels (as per your policy)
            permissionFilteredParcels = allParcels;
        }

        log.debug("After permission filtering: {} parcels", permissionFilteredParcels.size());

        long totalFiltered = permissionFilteredParcels.size();
        int totalPagesFiltered = (int) Math.ceil((double) totalFiltered / l);

        int startIndex = (p - 1) * l;
        int endIndex = Math.min(startIndex + l, (int) totalFiltered);

        List<Parcel> paginatedParcels =
                startIndex < totalFiltered ? permissionFilteredParcels.subList(startIndex, endIndex) : List.of();

        var items = paginatedParcels.stream().map(this::toDto).toList();
        return new ListResponse<>(items, totalFiltered, totalPagesFiltered, p, l);
    }

    @GetMapping("/all")
    public List<ParcelDto> allParcels() {
        List<Parcel> parcels = parcelRepository.findAll();

        if (permissionService.hasRole("ZONE_MANAGER")) {
            String currentUserId = userService.findCurrentUser()
                    .map(User::getId)
                    .orElse(null);

            if (currentUserId != null) {
                parcels = parcels.stream()
                        .filter(parcel -> parcel.getCreatedBy() != null
                                && currentUserId.equals(parcel.getCreatedBy().getId()))
                        .toList();
            } else {
                parcels = List.of(); // safest default for a manager without a loaded user
            }
        }
        // ADMIN and unauthenticated users: no filtering

        return parcels.stream().map(this::toDto).toList();
    }
    /**
     * Récupère une parcelle par son identifiant.
     *
     * @param id identifiant de la parcelle
     * @return données de la parcelle
     */
    @GetMapping("/{id}")
    public ParcelDto get(@PathVariable String id) {
        return parcelRepository.findById(id).map(this::toDto).orElse(null);
    }

    /**
     * Crée une nouvelle parcelle.
     * Accessible aux gestionnaires de zones et administrateurs.
     *
     * @param dto données de la parcelle à créer
     * @return la parcelle créée
     */
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

    /**
     * Met à jour une parcelle existante.
     * Accessible aux gestionnaires de zones et administrateurs.
     *
     * @param id identifiant de la parcelle à modifier
     * @param dto nouvelles données de la parcelle
     * @return la parcelle mise à jour
     */
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

    /**
     * Supprime une parcelle.
     * Accessible aux gestionnaires de zones et administrateurs.
     *
     * @param id identifiant de la parcelle à supprimer
     * @return réponse vide
     */
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

    /**
     * Met à jour le statut d'une parcelle.
     * Accessible aux gestionnaires de zones et administrateurs.
     *
     * @param id identifiant de la parcelle
     * @param request requête contenant le nouveau statut
     * @return la parcelle avec le statut mis à jour
     */
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
            log.debug("Parcel {} geometry: {}", p.getId(), geometry != null ? geometry.substring(0, Math.min(100, geometry.length())) + "..." : "null");

            if (geometry != null && !geometry.trim().isEmpty()) {
                vertices = geometryParsingService.parseWKTGeometry(geometry);
                log.debug("Parcel {} parsed {} vertices via entity", p.getId(), vertices.size());
                if (!vertices.isEmpty()) {
                    log.debug("First vertex: ({}, {})", vertices.get(0).lambertX(), vertices.get(0).lambertY());
                }
            } else {
                // Fallback: essayer via PostGIS service
                log.debug("Parcel {} trying PostGIS service fallback", p.getId());
                vertices = postGISGeometryService.extractParcelVertices(p.getId());
                log.debug("Parcel {} parsed {} vertices via PostGIS", p.getId(), vertices.size());
                if (!vertices.isEmpty()) {
                    log.debug("First vertex from PostGIS: ({}, {})", vertices.get(0).lambertX(), vertices.get(0).lambertY());
                }
            }
        } catch (Exception e) {
            log.error("Error parsing parcel geometry for {}: {}", p.getId(), e.getMessage(), e);
        }

        // Récupérer la devise du pays via zone → région → pays
        String countryCurrency = null;
        if (p.getZone() != null && p.getZone().getRegion() != null && p.getZone().getRegion().getCountry() != null) {
            countryCurrency = p.getZone().getRegion().getCountry().getCurrency();
        }

        // Récupérer les images de la parcelle
        List<ParcelImageDto> images = List.of();
        String primaryImageUrl = null;

        if (p.getImages() != null && !p.getImages().isEmpty()) {
            images = p.getImages().stream()
                .sorted((img1, img2) -> {
                    // Images principales d'abord, puis par ordre d'affichage
                    if (Boolean.TRUE.equals(img1.getIsPrimary()) && !Boolean.TRUE.equals(img2.getIsPrimary())) {
                        return -1;
                    }
                    if (!Boolean.TRUE.equals(img1.getIsPrimary()) && Boolean.TRUE.equals(img2.getIsPrimary())) {
                        return 1;
                    }
                    return Integer.compare(
                        img1.getDisplayOrder() != null ? img1.getDisplayOrder() : 0,
                        img2.getDisplayOrder() != null ? img2.getDisplayOrder() : 0
                    );
                })
                .map(img -> new ParcelImageDto(
                    img.getId(),
                    img.getFilename(),
                    img.getOriginalFilename(),
                    img.getContentType(),
                    img.getFileSize(),
                    img.getDescription(),
                    img.getDisplayOrder(),
                    img.getIsPrimary(),
                    "/api/parcel-images/" + img.getId() + "/download"
                ))
                .toList();

            // Trouver l'URL de l'image principale
            primaryImageUrl = images.stream()
                .filter(img -> Boolean.TRUE.equals(img.isPrimary()))
                .findFirst()
                .map(ParcelImageDto::url)
                .orElse(images.isEmpty() ? null : images.get(0).url());
        }

        return new ParcelDto(p.getId(), p.getReference(), p.getArea(),
                p.getStatus() == null ? null : p.getStatus().name(), p.getIsShowroom(),
                p.getZone() == null ? null : p.getZone().getId(),
                vertices, p.getLongitude(), p.getLatitude(),
                p.getCos(), p.getCus(), p.getHeightLimit(), p.getSetback(),
                p.getZone() == null ? null : p.getZone().getName(),
                p.getZone() == null ? null : p.getZone().getAddress(),
                p.getZone() == null ? null : p.getZone().getPrice(),
                p.getZone() == null ? null : (p.getZone().getPriceType() == null ? null : p.getZone().getPriceType().name()),
                countryCurrency, images, primaryImageUrl);
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

                log.debug("Vertices reçus pour parcelle: {}", dto.vertices());
                log.debug("Nouvelle géométrie générée: {}", newGeometry);
                // Calculer automatiquement les coordonnées WGS84
                geometryUpdateService.updateParcelCoordinates(p, dto.vertices());
            } else {
                log.debug("Géométrie générée nulle, conservation de l'existante");
            }
        } else {
            log.debug("Aucun vertex fourni, conservation de la géométrie existante");
            // Ne pas appeler geometryUpdateService pour éviter de réinitialiser les coordonnées
        }
    }

    private List<VertexDto> parseGeometry(String wkt) {
        if (wkt == null || wkt.trim().isEmpty()) return List.of();

        log.debug("Parsing WKT: {}", wkt);

        // Extraire les coordonnées du POLYGON((x1 y1, x2 y2, ...))
        String coords = wkt;
        if (coords.startsWith("POLYGON((")) {
            coords = coords.substring(9); // Remove "POLYGON(("
        }
        if (coords.endsWith("))")) {
            coords = coords.substring(0, coords.length() - 2); // Remove "))"
        }

        log.debug("Extracted coords: {}", coords);

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
