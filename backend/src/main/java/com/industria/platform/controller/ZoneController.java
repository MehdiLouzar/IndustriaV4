package com.industria.platform.controller;

import com.industria.platform.dto.VertexDto;
import com.industria.platform.dto.ZoneDto;
import com.industria.platform.entity.*;
import com.industria.platform.repository.*;
import com.industria.platform.service.StatusService;
import com.industria.platform.service.GeometryUpdateService;
import com.industria.platform.service.PermissionService;
import com.industria.platform.service.UserService;
import com.industria.platform.service.PostGISGeometryService;
import com.industria.platform.service.AuditService;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.data.domain.PageRequest;
import com.industria.platform.dto.ListResponse;

import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/api/zones")
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

    public ZoneController(StatusService statusService,
                          ZoneRepository zoneRepository,
                          ParcelRepository parcelRepository,
                          ActivityRepository activityRepository,
                          AmenityRepository amenityRepository,
                          ZoneActivityRepository zoneActivityRepository,
                          ZoneAmenityRepository zoneAmenityRepository,
                          ZoneTypeRepository zoneTypeRepository,
                          RegionRepository regionRepository,
                          GeometryUpdateService geometryUpdateService,
                          PermissionService permissionService,
                          UserService userService,
                          PostGISGeometryService postGISGeometryService,
                          AuditService auditService) {
        this.statusService = statusService;
        this.zoneRepository = zoneRepository;
        this.parcelRepository = parcelRepository;
        this.activityRepository = activityRepository;
        this.amenityRepository = amenityRepository;
        this.zoneActivityRepository = zoneActivityRepository;
        this.zoneAmenityRepository = zoneAmenityRepository;
        this.zoneTypeRepository = zoneTypeRepository;
        this.regionRepository = regionRepository;
        this.geometryUpdateService = geometryUpdateService;
        this.permissionService = permissionService;
        this.userService = userService;
        this.postGISGeometryService = postGISGeometryService;
        this.auditService = auditService;
    }

    @PutMapping("/{id}/status")
    @PreAuthorize("hasRole('ZONE_MANAGER') or hasRole('ADMIN')")
    public ResponseEntity<Zone> updateStatus(@PathVariable String id, @RequestBody StatusRequest request) {
        if (!permissionService.canModifyZone(id)) {
            return ResponseEntity.status(403).build(); // Forbidden
        }
        Zone oldZone = zoneRepository.findById(id).orElse(null);
        Zone zone = statusService.updateZoneStatus(id, request.status());
        
        auditService.log(AuditAction.UPDATE, "Zone", id, 
            oldZone != null ? oldZone.getStatus() : null, 
            zone.getStatus(), 
            "Changement de statut de la zone: " + zone.getName());
        
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
        int p = Math.max(1, page);
        int l = Math.min(Math.max(1, limit), 100);
        
        var pageable = PageRequest.of(p - 1, l);
        var res = zoneRepository.findAll(pageable);
        
        // Filtrage basique par nom/adresse si search est fourni
        if (search != null && !search.trim().isEmpty()) {
            res = zoneRepository.findByNameContainingIgnoreCaseOrAddressContainingIgnoreCase(
                search.trim(), search.trim(), pageable);
        }
        
        // Application des filtres avancés côté application (pour simplicité)
        var filteredZones = res.getContent().stream()
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
            
        var items = filteredZones.stream().map(this::toDto).toList();
        long totalFiltered = filteredZones.size();
        int totalPagesFiltered = (int) Math.ceil((double) totalFiltered / l);
        
        return new ListResponse<>(items, totalFiltered, totalPagesFiltered, p, l);
    }

    @GetMapping("/all")
    public List<ZoneDto> allZones() {
        return zoneRepository.findAllWithParcels().stream().map(this::toDto).toList();
    }

    @GetMapping("/{id}")
    public ZoneDto get(@PathVariable String id) {
        Zone z = zoneRepository.findById(id).orElseThrow();
        return toDto(z);
    }

    @PostMapping
    @PreAuthorize("hasRole('ZONE_MANAGER') or hasRole('ADMIN')")
    public ZoneDto create(@RequestBody ZoneDto dto) {
        try {
            System.out.println("DEBUG: Création d'une nouvelle zone: " + dto.name());
            Zone z = new Zone();
            updateEntity(z, dto);
            
            // Définir automatiquement le créateur
            User currentUser = userService.getCurrentUser();
            if (currentUser != null) {
                z.setCreatedBy(currentUser);
                System.out.println("DEBUG: Créateur défini: " + currentUser.getEmail());
            } else {
                System.out.println("DEBUG: Aucun utilisateur connecté, création sans créateur");
            }
            
            Zone saved = zoneRepository.save(z);
            System.out.println("DEBUG: Zone sauvegardée avec ID: " + saved.getId());
            
            auditService.log(AuditAction.CREATE, "Zone", saved.getId(), 
                null, saved, 
                "Création de la zone: " + saved.getName());
            
            return toDto(saved);
        } catch (Exception e) {
            System.err.println("ERREUR lors de la création de la zone: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ZONE_MANAGER') or hasRole('ADMIN')")
    public ResponseEntity<ZoneDto> update(@PathVariable String id, @RequestBody ZoneDto dto) {
        if (!permissionService.canModifyZone(id)) {
            return ResponseEntity.status(403).build(); // Forbidden
        }
        
        Zone oldZone = zoneRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Zone not found with id: " + id));
        Zone zoneClone = new Zone();
        zoneClone.setName(oldZone.getName());
        zoneClone.setDescription(oldZone.getDescription());
        zoneClone.setStatus(oldZone.getStatus());
        
        updateEntity(oldZone, dto);
        zoneRepository.save(oldZone);
        
        auditService.log(AuditAction.UPDATE, "Zone", id, 
            zoneClone, oldZone, 
            "Modification de la zone: " + oldZone.getName());
        
        return ResponseEntity.ok(toDto(oldZone));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ZONE_MANAGER') or hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        if (!permissionService.canModifyZone(id)) {
            return ResponseEntity.status(403).build(); // Forbidden
        }
        
        Zone zone = zoneRepository.findById(id).orElse(null);
        zoneRepository.deleteById(id);
        
        auditService.log(AuditAction.DELETE, "Zone", id, 
            zone, null, 
            "Suppression de la zone: " + (zone != null ? zone.getName() : id));
        
        return ResponseEntity.ok().build();
    }

    private ZoneDto toDto(Zone z) {
        // Extraire les vertices directement depuis PostGIS pour éviter la corruption
        List<VertexDto> vertices = List.of();
        try {
            vertices = postGISGeometryService.extractZoneVertices(z.getId());
        } catch (Exception e) {
            System.err.println("Erreur lors de l'extraction des vertices pour zone " + z.getId() + ": " + e.getMessage());
            // Fallback vers les coordonnées stockées dans les colonnes latitude/longitude
        }
        
        // Calculer le nombre total de parcelles et parcelles disponibles directement depuis le repository
        int totalParcels = 0;
        int availableParcels = 0;
        
        try {
            // Utiliser le ParcelRepository pour compter les parcelles
            totalParcels = parcelRepository.countByZoneId(z.getId());
            availableParcels = parcelRepository.countByZoneIdAndStatus(z.getId(), ParcelStatus.LIBRE);
            System.err.println("DEBUG: Zone " + z.getId() + " has " + totalParcels + " total parcels and " + availableParcels + " available parcels");
        } catch (Exception e) {
            System.err.println("Erreur lors du comptage des parcelles pour zone " + z.getId() + ": " + e.getMessage());
        }
        
        return new ZoneDto(
                z.getId(),
                z.getName(),
                z.getDescription(),
                z.getAddress(),
                z.getTotalArea(),
                z.getPrice(),
                z.getPriceType() == null ? null : z.getPriceType().name(),
                z.getStatus() == null ? null : z.getStatus().name(),
                z.getRegion() == null ? null : z.getRegion().getId(),
                z.getZoneType() == null ? null : z.getZoneType().getId(),
                z.getActivities() == null ? List.of() : z.getActivities().stream().map(a -> a.getActivity().getId()).toList(),
                z.getAmenities() == null ? List.of() : z.getAmenities().stream().map(a -> a.getAmenity().getId()).toList(),
                vertices,
                z.getLatitude(),  // Utiliser les coordonnées pré-calculées
                z.getLongitude(), // Utiliser les coordonnées pré-calculées
                totalParcels,
                availableParcels
        );
    }

    private void updateEntity(Zone z, ZoneDto dto) {
        System.out.println("DEBUG: updateEntity appelé pour zone " + z.getId());
        z.setName(dto.name());
        z.setDescription(dto.description());
        z.setAddress(dto.address());
        z.setTotalArea(dto.totalArea());
        z.setPrice(dto.price());
        
        // Gérer le priceType
        if (dto.priceType() != null) {
            z.setPriceType(PriceType.valueOf(dto.priceType()));
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
                
                System.out.println("DEBUG: Vertices reçus: " + dto.vertices());
                System.out.println("DEBUG: Nouvelle géométrie générée: " + newGeometry);
                // Calculer automatiquement les coordonnées WGS84
                geometryUpdateService.updateZoneCoordinates(z, dto.vertices());
            } else {
                System.out.println("DEBUG: Géométrie générée nulle, conservation de l'existante");
            }
        } else {
            System.out.println("DEBUG: Aucun vertex fourni, conservation de la géométrie existante");
            System.out.println("DEBUG: Géométrie actuelle préservée pour zone " + z.getId());
            // Ne pas appeler geometryUpdateService pour éviter de réinitialiser les coordonnées
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
                    zoneActivityRepository.save(za);
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
                    zoneAmenityRepository.save(zm);
                    z.getAmenities().add(zm);
                }
            }
        }
    }

    // Méthode parseGeometry() supprimée - remplacée par PostGISGeometryService.extractZoneVertices()
    // pour éviter la corruption des coordonnées Lambert

    private double[] parseCentroid(String wkt) {
        if (wkt == null) return new double[]{0, 0};
        String numbers = wkt.replaceAll("[^0-9.\\- ]", " ");
        String[] parts = numbers.trim().split(" +");
        double sumX = 0, sumY = 0; int count = 0;
        for (int i = 0; i + 1 < parts.length; i += 2) {
            sumX += Double.parseDouble(parts[i]);
            sumY += Double.parseDouble(parts[i + 1]);
            count++;
        }
        if (count == 0) return new double[]{0, 0};
        return new double[]{sumX / count, sumY / count};
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

    public record StatusRequest(ZoneStatus status) {}
}
