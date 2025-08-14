package com.industria.platform.controller;

import com.industria.platform.dto.ListResponse;
import com.industria.platform.dto.ParcelDto;
import com.industria.platform.dto.ParcelImageDto;
import com.industria.platform.dto.VertexDto;
import com.industria.platform.dto.ZoneDto;
import com.industria.platform.dto.ZoneImageDto;
import com.industria.platform.entity.*;
import com.industria.platform.exception.EntityNotFoundException;
import com.industria.platform.exception.ForbiddenException;
import com.industria.platform.repository.*;
import com.industria.platform.service.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;

/**
 * Contrôleur REST pour la gestion des zones industrielles.
 * 
 * Gère les opérations CRUD sur les zones avec gestion des permissions,
 * audit des modifications et calculs géospatiaux automatiques.
 * 
 * @author Industria Platform Team
 * @version 1.0
 * @since 1.0
 */
@RestController
@RequestMapping("/api/zones")
@RequiredArgsConstructor
@Slf4j
public class ZoneController {

    private final StatusService statusService;
    private final ZoneRepository zoneRepository;
    private final ParcelRepository parcelRepository;
    private final ActivityRepository activityRepository;
    private final AmenityRepository amenityRepository;
    private final ZoneActivityRepository zoneActivityRepository;
    private final ZoneAmenityRepository zoneAmenityRepository;
    private final ZoneTypeRepository zoneTypeRepository;
    private final RegionRepository regionRepository;
    private final GeometryUpdateService geometryUpdateService;
    private final PermissionService permissionService;
    private final UserService userService;
    private final PostGISGeometryService postGISGeometryService;
    private final AuditService auditService;
    private final GeometryParsingService geometryParsingService;




    @PutMapping("/{id}/status")
    @PreAuthorize("hasRole('ZONE_MANAGER') or hasRole('ADMIN')")
    public ResponseEntity<Zone> updateStatus(@PathVariable String id, @RequestBody StatusRequest request) {
        log.debug("Updating status for zone: {} to {}", id, request.status());

        if (!permissionService.canModifyZone(id)) {
            log.warn("User attempted to modify zone {} without permission", id);
            throw new ForbiddenException("Zone", "modify");
        }
        Zone oldZone = zoneRepository.findById(id).orElseThrow(() -> new EntityNotFoundException("Zone", id));
        Zone zone = statusService.updateZoneStatus(id, request.status());
        
        auditService.log(AuditAction.UPDATE, "Zone", id, 
            oldZone != null ? oldZone.getStatus() : null, 
            zone.getStatus(), 
            "Changement de statut de la zone: " + zone.getName());

        assert oldZone != null;
        log.info("Zone {} status updated from {} to {}", id, oldZone.getStatus(), zone.getStatus());

        return ResponseEntity.ok(zone);
    }

    @GetMapping
    public ListResponse<ZoneDto> all(@RequestParam(defaultValue = "1") int page,
                                     @RequestParam(defaultValue = "10") int limit,
                                     @RequestParam(required = false) String search,
                                     @RequestParam(required = false) String regionId,
                                     @RequestParam(required = false) String zoneTypeId,
                                     @RequestParam(required = false) String status,
                                     @RequestParam(required = false) Double minArea,
                                     @RequestParam(required = false) Double maxArea,
                                     @RequestParam(required = false) Double minPrice,
                                     @RequestParam(required = false) Double maxPrice) {
        log.debug("Fetching zones - page: {}, limit: {}, search: {}", page, limit, search);

        int p = Math.max(1, page);
        int l = Math.min(Math.max(1, limit), 100);
        
        // Récupérer TOUTES les zones d'abord (pas de pagination initiale)
        List<Zone> allZones;
        
        if (search != null && !search.trim().isEmpty()) {
            // Pour la recherche, récupérer toutes les zones qui correspondent
            var searchPageable = PageRequest.of(0, Integer.MAX_VALUE); // Récupérer toutes
            allZones = zoneRepository.findByNameContainingIgnoreCaseOrAddressContainingIgnoreCase(
                search.trim(), search.trim(), searchPageable).getContent();
        } else {
            allZones = zoneRepository.findAll();
        }
        
        // Filtrer selon les permissions seulement pour les utilisateurs connectés non-ADMIN
        List<Zone> permissionFilteredZones;
        try {
            // Vérifier si l'utilisateur est connecté et a un rôle spécifique
            if (permissionService.hasRole("ZONE_MANAGER")) {
                // ZONE_MANAGER voit seulement ses zones
                String currentUserEmail = userService.getCurrentUserEmail();
                permissionFilteredZones = allZones.stream()
                    .filter(zone -> zone.getCreatedBy() != null && 
                                  zone.getCreatedBy().getEmail().equals(currentUserEmail))
                    .toList();
            } else {
                // ADMIN et utilisateurs non connectés voient toutes les zones
                permissionFilteredZones = allZones;
            }
        } catch (Exception e) {
            // Utilisateur non connecté - voir toutes les zones
            permissionFilteredZones = allZones;
        }
        
        // Application des autres filtres avancés
        var finalFilteredZones = permissionFilteredZones.stream()
            .filter(zone -> regionId == null || regionId.isEmpty() || 
                (zone.getRegion() != null && regionId.equals(zone.getRegion().getId())))
            .filter(zone -> zoneTypeId == null || zoneTypeId.isEmpty() || 
                (zone.getZoneType() != null && zoneTypeId.equals(zone.getZoneType().getId())))
            .filter(zone -> status == null || status.isEmpty() || 
                (zone.getStatus() != null && status.equals(zone.getStatus().name())))
            .filter(zone -> minArea == null || 
                (zone.getTotalArea() != null && zone.getTotalArea() >= minArea))
            .filter(zone -> maxArea == null || 
                (zone.getTotalArea() != null && zone.getTotalArea() <= maxArea))
            .filter(zone -> minPrice == null || 
                (zone.getPrice() != null && zone.getPrice() >= minPrice))
            .filter(zone -> maxPrice == null || 
                (zone.getPrice() != null && zone.getPrice() <= maxPrice))
            .toList();
        
        // MAINTENANT appliquer la pagination sur les résultats filtrés
        long totalFiltered = finalFilteredZones.size();
        int totalPagesFiltered = (int) Math.ceil((double) totalFiltered / l);
        
        int startIndex = (p - 1) * l;
        int endIndex = Math.min(startIndex + l, (int) totalFiltered);
        
        List<Zone> paginatedZones = startIndex < totalFiltered ? 
            finalFilteredZones.subList(startIndex, endIndex) : List.of();
            
        var items = paginatedZones.stream().map(this::toDto).toList();
        
        return new ListResponse<>(items, totalFiltered, totalPagesFiltered, p, l);
    }

    @GetMapping("/all")
    public List<ZoneDto> allZones() {
        log.debug("Loading all zones with parcels");
        List<Zone> zones = zoneRepository.findAllWithParcelsAndCreators();
        log.debug("Loaded {} zones from repository", zones.size());
        
        // Filtrer selon les permissions seulement pour les ZONE_MANAGER connectés
        try {
            if (permissionService.hasRole("ZONE_MANAGER")) {
                // ZONE_MANAGER voit seulement ses zones
                String currentUserEmail = userService.getCurrentUserEmail();
                zones = zones.stream()
                    .filter(zone -> zone.getCreatedBy() != null && 
                                  zone.getCreatedBy().getEmail().equals(currentUserEmail))
                    .toList();
                log.debug("Filtered to {} zones for ZONE_MANAGER {}", zones.size(), currentUserEmail);
            }
            // ADMIN et utilisateurs non connectés voient toutes les zones
        } catch (Exception e) {
            // Utilisateur non connecté - voir toutes les zones (pas de filtrage)
            log.debug("No filtering applied - user not connected or no specific role");
        }
        
        List<ZoneDto> result = zones.stream().map(this::toDto).toList();
        log.debug("Returning {} zone DTOs", result.size());
        return result;
    }

    @GetMapping("/{id}")
    public ZoneDto get(@PathVariable String id) {
        Zone z = zoneRepository.findById(id).orElseThrow();
        return toDto(z);
    }
    
    @GetMapping("/check-name")
    public ResponseEntity<CheckNameResponse> checkName(@RequestParam String name) {
        log.debug("Checking if zone name exists: {}", name);
        boolean exists = zoneRepository.existsByNameIgnoreCase(name.trim());
        return ResponseEntity.ok(new CheckNameResponse(exists));
    }

    @PostMapping
    @PreAuthorize("hasRole('ZONE_MANAGER') or hasRole('ADMIN')")
    public ZoneDto create(@RequestBody ZoneDto dto) {
        try {

            log.debug("Création d'une nouvelle zone: {}", dto.name());

            Zone z = new Zone();
            
            // Définir automatiquement le créateur avant updateEntity
            User currentUser = userService.getCurrentUser();
            if (currentUser != null) {
                z.setCreatedBy(currentUser);
                log.debug("Créateur défini: {}", currentUser.getEmail());
            } else {
                log.error("Aucun utilisateur connecté pour créer la zone");
                throw new RuntimeException("Utilisateur non authentifié : impossible de créer une zone");
            }
            
            // Sauvegarder d'abord la zone de base pour avoir un ID et établir les relations
            updateEntityWithoutGeometry(z, dto);
            Zone saved = zoneRepository.save(z);
            
            // Maintenant mettre à jour la géométrie avec les coordonnées
            if (dto.vertices() != null && !dto.vertices().isEmpty()) {
                updateGeometryAndCoordinates(saved, dto.vertices());
                saved = zoneRepository.save(saved);
            }

            log.debug("Zone sauvegardée avec ID: {}",saved.getId());
            
            auditService.log(AuditAction.CREATE, "Zone", saved.getId(), 
                null, saved, 
                "Création de la zone: " + saved.getName());
            
            return toDto(saved);
        } catch (Exception e) {

            log.error("ERREUR lors de la création de la zone: {} ",e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ZONE_MANAGER') or hasRole('ADMIN')")
    public ResponseEntity<ZoneDto> update(@PathVariable String id, @RequestBody ZoneDto dto) {
        log.info("Updating zone: {}", id);
        if (!permissionService.canModifyZone(id)) {
            log.warn("User attempted to modify zone {} without permission", id);
            throw new ForbiddenException("Zone", "modify");        }
        
        Zone oldZone = zoneRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Zone not found with id: " + id));
        Zone zoneClone = new Zone();
        zoneClone.setName(oldZone.getName());
        zoneClone.setDescription(oldZone.getDescription());
        zoneClone.setStatus(oldZone.getStatus());
        
        // Mettre à jour les propriétés de base
        updateEntityWithoutGeometry(oldZone, dto);
        
        // Si il y a de nouvelles vertices, mettre à jour la géométrie
        if (dto.vertices() != null && !dto.vertices().isEmpty()) {
            updateGeometryAndCoordinates(oldZone, dto.vertices());
        }
        zoneRepository.save(oldZone);
        
        auditService.log(AuditAction.UPDATE, "Zone", id, 
            zoneClone, oldZone, 
            "Modification de la zone: " + oldZone.getName());
        log.info("Zone {} updated successfully", id);

        
        return ResponseEntity.ok(toDto(oldZone));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ZONE_MANAGER') or hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        log.info("Deleting zone: {}", id);
        if (!permissionService.canModifyZone(id)) {
            log.warn("User attempted to delete zone {} without permission", id);
            throw new ForbiddenException("Zone", "delete");
        }
        
        Zone zone = zoneRepository.findById(id).orElseThrow(() -> new EntityNotFoundException("Zone not found with id: " + id));
        if (zone == null) {
            return ResponseEntity.notFound().build();
        }
        
        try {
            // Nettoyer manuellement les relations zone_activities et zone_amenities
            // car elles n'ont pas de cascade delete
            if (zone.getActivities() != null && !zone.getActivities().isEmpty()) {
                log.debug("Deleting {} zone activities", zone.getActivities().size());
                zoneActivityRepository.deleteAll(zone.getActivities());
            }
            if (zone.getAmenities() != null && !zone.getAmenities().isEmpty()) {
                log.debug("Deleting {} zone amenities", zone.getAmenities().size());
                zoneAmenityRepository.deleteAll(zone.getAmenities());
            }
            
            // Les parcels, images ont cascade=ALL donc seront supprimées automatiquement
            zoneRepository.deleteById(id);
            
            auditService.log(AuditAction.DELETE, "Zone", id, 
                zone, null, 
                "Suppression de la zone: " + zone.getName());
            log.info("Zone {} deleted successfully", id);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            log.error("Error deleting zone {}", id, e);
            throw new RuntimeException("Failed to delete zone: " + e.getMessage());
        }
    }

    private ZoneDto toDto(Zone z) {
        // Extraire les vertices directement depuis PostGIS pour éviter la corruption
        List<VertexDto> vertices = List.of();
        try {
            vertices = postGISGeometryService.extractZoneVertices(z.getId());
        } catch (Exception e) {
            log.error("Error extracting vertices for zone {}", z.getId(), e);

        }
        
        // Calculer le nombre total de parcelles et parcelles disponibles directement depuis le repository
        int totalParcels = 0;
        int availableParcels = 0;
        
        try {
            // Utiliser le ParcelRepository pour compter les parcelles
            totalParcels = parcelRepository.countByZoneId(z.getId());
            availableParcels = parcelRepository.countByZoneIdAndStatus(z.getId(), ParcelStatus.LIBRE);
            log.trace("Zone {} has {} total parcels, {} available", z.getId(), totalParcels, availableParcels);
        } catch (Exception e) {
            log.error("Error counting parcels for zone {}", z.getId(), e);
        }
        
        // Convertir les parcelles en DTOs si elles existent
        List<ParcelDto> parcelDtos = List.of();
        log.debug("Zone {}: getParcels() = {}", z.getId(), z.getParcels() != null ? z.getParcels().size() : "null");
        
        if (z.getParcels() != null && !z.getParcels().isEmpty()) {
            try {
                parcelDtos = z.getParcels().stream()
                    .map(this::convertParcelToDto)
                    .toList();
                log.debug("Zone {} has {} parcels converted to DTOs", z.getId(), parcelDtos.size());
            } catch (Exception e) {
                log.error("Error converting parcels for zone {}", z.getId(), e);
            }
        } else {
            log.debug("Zone {} has no parcels or parcels is null", z.getId());
        }

        // Récupérer les informations du pays via la région
        String countryId = null;
        String countryCode = null;
        String countryCurrency = null;
        
        if (z.getRegion() != null && z.getRegion().getCountry() != null) {
            countryId = z.getRegion().getCountry().getId();
            countryCode = z.getRegion().getCountry().getCode();
            countryCurrency = z.getRegion().getCountry().getCurrency();
        }
        
        // Récupérer les images de la zone
        List<ZoneImageDto> images = List.of();
        String primaryImageUrl = null;
        
        if (z.getImages() != null && !z.getImages().isEmpty()) {
            images = z.getImages().stream()
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
                .map(img -> new ZoneImageDto(
                    img.getId(),
                    img.getFilename(),
                    img.getOriginalFilename(),
                    img.getContentType(),
                    img.getFileSize(),
                    img.getDescription(),
                    img.getDisplayOrder(),
                    img.getIsPrimary(),
                    "/api/zones/" + z.getId() + "/images/" + img.getId() + "/file"
                ))
                .toList();
                
            // Trouver l'URL de l'image principale
            primaryImageUrl = images.stream()
                .filter(img -> Boolean.TRUE.equals(img.isPrimary()))
                .findFirst()
                .map(ZoneImageDto::url)
                .orElse(images.isEmpty() ? null : images.get(0).url());
        }
        
        return new ZoneDto(
                z.getId(),
                z.getName(),
                z.getDescription(),
                z.getAddress(),
                z.getTotalArea(),
                z.getPrice(),
                z.getPriceType() == null ? null : z.getPriceType().name(),
                z.getConstructionType() == null ? null : z.getConstructionType().name(),
                z.getStatus() == null ? null : z.getStatus().name(),
                z.getRegion() == null ? null : z.getRegion().getId(),
                z.getZoneType() == null ? null : z.getZoneType().getId(),
                z.getActivities() == null ? List.of() : z.getActivities().stream().map(a -> a.getActivity().getId()).toList(),
                z.getAmenities() == null ? List.of() : z.getAmenities().stream().map(a -> a.getAmenity().getId()).toList(),
                vertices,
                z.getLatitude(),  // Utiliser les coordonnées pré-calculées
                z.getLongitude(), // Utiliser les coordonnées pré-calculées
                totalParcels,
                availableParcels,
                parcelDtos,
                countryId,
                countryCode,
                countryCurrency,
                images,
                primaryImageUrl
        );
    }

    private ParcelDto convertParcelToDto(com.industria.platform.entity.Parcel p) {
        List<VertexDto> vertices = List.of();
        
        // Récupérer la géométrie - d'abord depuis l'entity, puis via PostGIS service
        try {
            String geometry = p.getGeometry();
            log.debug("Zone parcel {} geometry: {}", p.getId(), (geometry != null ? geometry.substring(0, Math.min(50, geometry.length())) + "..." : "null"));
            
            if (geometry != null && !geometry.trim().isEmpty()) {
                vertices = geometryParsingService.parseWKTGeometry(geometry);
                log.debug("Zone parcel {} parsed {} vertices via entity", p.getId(), vertices.size());
            } else {
                // Fallback: essayer via PostGIS service  
                log.debug("Zone parcel {} trying PostGIS service fallback", p.getId());
                vertices = postGISGeometryService.extractParcelVertices(p.getId());
                log.debug("Zone parcel {} parsed {} vertices via PostGIS", p.getId(), vertices.size());
            }
        } catch (Exception e) {
            log.error("Error extracting parcel geometry for {}", p.getId(), e);
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
                    "/api/parcels/" + p.getId() + "/images/" + img.getId() + "/file"
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

    private List<VertexDto> parseParcelGeometry(String wkt) {
        if (wkt == null || wkt.trim().isEmpty()) return List.of();
        
        // Extraire les coordonnées du POLYGON((x1 y1, x2 y2, ...))
        String coords = wkt;
        if (coords.startsWith("POLYGON((")) {
            coords = coords.substring(9); // Remove "POLYGON(("
        }
        if (coords.endsWith("))")) {
            coords = coords.substring(0, coords.length() - 2); // Remove "))"
        }
        
        List<VertexDto> verts = new ArrayList<>();
        String[] coordPairs = coords.split(",");
        
        for (int i = 0; i < coordPairs.length; i++) {
            String[] xy = coordPairs[i].trim().split("\\s+");
            if (xy.length >= 2) {
                try {
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
                } catch (NumberFormatException e) {
                    log.warn("Could not parse coordinates: {} {}", xy[0], xy.length > 1 ? xy[1] : "");
                }
            }
        }
        return verts;
    }

    private void updateEntity(Zone z, ZoneDto dto) {
        log.trace("Updating zone entity with data from DTO");
        z.setName(dto.name());
        z.setDescription(dto.description());
        z.setAddress(dto.address());
        z.setTotalArea(dto.totalArea());
        z.setPrice(dto.price());
        
        // Gérer le priceType
        if (dto.priceType() != null) {
            z.setPriceType(PriceType.valueOf(dto.priceType()));
        }
        
        // Gérer le constructionType
        if (dto.constructionType() != null) {
            z.setConstructionType(ConstructionType.valueOf(dto.constructionType()));
        }
        
        if (dto.status() != null) {
            z.setStatus(ZoneStatus.valueOf(dto.status()));
        }
        if (dto.zoneTypeId() != null && !dto.zoneTypeId().isEmpty()) {
            z.setZoneType(zoneTypeRepository.findById(dto.zoneTypeId()).orElse(null));
        }
        if (dto.regionId() != null && !dto.regionId().isEmpty()) {
            z.setRegion(regionRepository.findById(dto.regionId()).orElse(null));
        }
        
        // Préserver la géométrie existante si pas de nouveaux vertices
        if (dto.vertices() != null && !dto.vertices().isEmpty()) {
            String newGeometry = buildGeometry(dto.vertices());
            if (newGeometry != null) {
                z.setGeometry(newGeometry);
                z.setSrid(4326);

                log.debug("Updating zone geometry with {} vertices", dto.vertices().size());

                // Calculer automatiquement les coordonnées WGS84
                geometryUpdateService.updateZoneCoordinates(z, dto.vertices());
            } else {
                log.warn("Failed to build geometry from vertices");
            }
        } else {
            log.trace("No vertices provided, preserving existing geometry");

        }

        // Initialiser les collections si nécessaire
        if (z.getActivities() == null) {
            z.setActivities(new java.util.HashSet<>());
        } else if (!z.getActivities().isEmpty()) {
            zoneActivityRepository.deleteAll(z.getActivities());
            z.getActivities().clear();
        }
        if (z.getAmenities() == null) {
            z.setAmenities(new java.util.HashSet<>());
        } else if (!z.getAmenities().isEmpty()) {
            zoneAmenityRepository.deleteAll(z.getAmenities());
            z.getAmenities().clear();
        }

        if (dto.activityIds() != null) {
            for (String aid : dto.activityIds()) {
                Activity act = activityRepository.findById(aid).orElse(null);
                if (act != null) {
                    ZoneActivity za = new ZoneActivity();
                    za.setZone(z);
                    za.setActivity(act);
                    // Ne pas sauvegarder immédiatement, ajouter à la collection
                    z.getActivities().add(za);
                }
            }
        }

        if (dto.amenityIds() != null) {
            for (String mid : dto.amenityIds()) {
                Amenity am = amenityRepository.findById(mid).orElse(null);
                if (am != null) {
                    ZoneAmenity zm = new ZoneAmenity();
                    zm.setZone(z);
                    zm.setAmenity(am);
                    // Ne pas sauvegarder immédiatement, ajouter à la collection
                    z.getAmenities().add(zm);
                }
            }
        }
    }



    private String buildGeometry(List<VertexDto> verts) {
        if (verts == null || verts.isEmpty()) return null;
        StringBuilder sb = new StringBuilder("POLYGON((");
        for (int i = 0; i < verts.size(); i++) {
            VertexDto v = verts.get(i);
            if (i > 0) sb.append(',');
            sb.append(v.lambertX()).append(' ').append(v.lambertY());
        }
        // close polygon
        VertexDto first = verts.get(0);
        sb.append(',').append(first.lambertX()).append(' ').append(first.lambertY());
        sb.append("))");
        return sb.toString();
    }
    
    /**
     * Met à jour l'entité zone sans traiter la géométrie (pour la création)
     */
    private void updateEntityWithoutGeometry(Zone z, ZoneDto dto) {
        log.trace("Updating zone entity without geometry");
        z.setName(dto.name());
        z.setDescription(dto.description());
        z.setAddress(dto.address());
        z.setTotalArea(dto.totalArea());
        z.setPrice(dto.price());
        
        // Gérer le priceType
        if (dto.priceType() != null) {
            z.setPriceType(PriceType.valueOf(dto.priceType()));
        }
        
        // Gérer le constructionType
        if (dto.constructionType() != null) {
            z.setConstructionType(ConstructionType.valueOf(dto.constructionType()));
        }
        
        if (dto.status() != null) {
            z.setStatus(ZoneStatus.valueOf(dto.status()));
        }
        if (dto.zoneTypeId() != null && !dto.zoneTypeId().isEmpty()) {
            z.setZoneType(zoneTypeRepository.findById(dto.zoneTypeId()).orElse(null));
        }
        if (dto.regionId() != null && !dto.regionId().isEmpty()) {
            z.setRegion(regionRepository.findById(dto.regionId()).orElse(null));
        }

        // Initialiser les collections si nécessaire
        if (z.getActivities() == null) {
            z.setActivities(new java.util.HashSet<>());
        } else if (!z.getActivities().isEmpty()) {
            // Pour les mises à jour, nettoyer les relations existantes
            zoneActivityRepository.deleteAll(z.getActivities());
            z.getActivities().clear();
        }
        if (z.getAmenities() == null) {
            z.setAmenities(new java.util.HashSet<>());
        } else if (!z.getAmenities().isEmpty()) {
            // Pour les mises à jour, nettoyer les relations existantes
            zoneAmenityRepository.deleteAll(z.getAmenities());
            z.getAmenities().clear();
        }

        // Gérer les activités - ajouter à la collection sans sauvegarder immédiatement
        if (dto.activityIds() != null) {
            for (String aid : dto.activityIds()) {
                Activity act = activityRepository.findById(aid).orElse(null);
                if (act != null) {
                    ZoneActivity za = new ZoneActivity();
                    za.setZone(z);
                    za.setActivity(act);
                    // Ne pas sauvegarder immédiatement, ajouter à la collection
                    z.getActivities().add(za);
                }
            }
        }

        // Gérer les amenities - ajouter à la collection sans sauvegarder immédiatement  
        if (dto.amenityIds() != null) {
            for (String mid : dto.amenityIds()) {
                Amenity am = amenityRepository.findById(mid).orElse(null);
                if (am != null) {
                    ZoneAmenity zm = new ZoneAmenity();
                    zm.setZone(z);
                    zm.setAmenity(am);
                    // Ne pas sauvegarder immédiatement, ajouter à la collection
                    z.getAmenities().add(zm);
                }
            }
        }
    }
    
    /**
     * Met à jour la géométrie et calcule les coordonnées WGS84
     */
    private void updateGeometryAndCoordinates(Zone z, List<VertexDto> vertices) {
        try {
            String newGeometry = buildGeometry(vertices);
            if (newGeometry != null) {
                z.setGeometry(newGeometry);
                z.setSrid(4326);

                log.debug("Updating zone geometry with {} vertices", vertices.size());

                // Calculer automatiquement les coordonnées WGS84
                // La zone a maintenant un ID et ses relations sont établies
                if (z.getRegion() != null && z.getRegion().getCountry() != null) {
                    geometryUpdateService.updateZoneCoordinates(z, vertices);
                    log.debug("Zone coordinates updated successfully");
                } else {
                    log.warn("Zone region/country not set, skipping coordinate calculation");
                    z.setLatitude(null);
                    z.setLongitude(null);
                }
            } else {
                log.warn("Failed to build geometry from vertices");
            }
        } catch (Exception e) {
            log.error("Error updating zone geometry and coordinates: {}", e.getMessage());
            // Ne pas bloquer la création, juste laisser les coordonnées nulles
            z.setLatitude(null);
            z.setLongitude(null);
        }
    }

    public record StatusRequest(ZoneStatus status) {}
    public record CheckNameResponse(boolean exists) {}
}
