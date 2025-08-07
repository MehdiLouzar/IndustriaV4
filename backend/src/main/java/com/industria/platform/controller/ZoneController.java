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

    public ZoneController(StatusService statusService,
                          ZoneRepository zoneRepository,
                          ActivityRepository activityRepository,
                          AmenityRepository amenityRepository,
                          ZoneActivityRepository zoneActivityRepository,
                          ZoneAmenityRepository zoneAmenityRepository,
                          ZoneTypeRepository zoneTypeRepository,
                          RegionRepository regionRepository,
                          GeometryUpdateService geometryUpdateService,
                          PermissionService permissionService,
                          UserService userService,
                          PostGISGeometryService postGISGeometryService) {
        this.statusService = statusService;
        this.zoneRepository = zoneRepository;
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
    }

    @PutMapping("/{id}/status")
    @PreAuthorize("hasRole('ZONE_MANAGER') or hasRole('ADMIN')")
    public ResponseEntity<Zone> updateStatus(@PathVariable String id, @RequestBody StatusRequest request) {
        if (!permissionService.canModifyZone(id)) {
            return ResponseEntity.status(403).build(); // Forbidden
        }
        Zone zone = statusService.updateZoneStatus(id, request.status());
        return ResponseEntity.ok(zone);
    }

    @GetMapping
    public ListResponse<ZoneDto> all(@RequestParam(defaultValue = "1") int page,
                                     @RequestParam(defaultValue = "10") int limit) {
        int p = Math.max(1, page);
        int l = Math.min(Math.max(1, limit), 100);
        var res = zoneRepository.findAll(PageRequest.of(p - 1, l));
        var items = res.getContent().stream().map(this::toDto).toList();
        return new ListResponse<>(items, res.getTotalElements(), res.getTotalPages(), p, l);
    }

    @GetMapping("/all")
    public List<ZoneDto> allZones() {
        return zoneRepository.findAll().stream().map(this::toDto).toList();
    }

    @GetMapping("/{id}")
    public ZoneDto get(@PathVariable String id) {
        Zone z = zoneRepository.findById(id).orElseThrow();
        return toDto(z);
    }

    @PostMapping
    @PreAuthorize("hasRole('ZONE_MANAGER') or hasRole('ADMIN')")
    public ZoneDto create(@RequestBody ZoneDto dto) {
        Zone z = new Zone();
        updateEntity(z, dto);
        
        // Définir automatiquement le créateur
        z.setCreatedBy(userService.getCurrentUser());
        
        zoneRepository.save(z);
        return toDto(z);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ZONE_MANAGER') or hasRole('ADMIN')")
    public ResponseEntity<ZoneDto> update(@PathVariable String id, @RequestBody ZoneDto dto) {
        if (!permissionService.canModifyZone(id)) {
            return ResponseEntity.status(403).build(); // Forbidden
        }
        
        Zone z = zoneRepository.findById(id).orElseThrow();
        updateEntity(z, dto);
        zoneRepository.save(z);
        return ResponseEntity.ok(toDto(z));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ZONE_MANAGER') or hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        if (!permissionService.canModifyZone(id)) {
            return ResponseEntity.status(403).build(); // Forbidden
        }
        
        zoneRepository.deleteById(id);
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
        
        return new ZoneDto(
                z.getId(),
                z.getName(),
                z.getDescription(),
                z.getAddress(),
                z.getTotalArea(),
                z.getPrice(),
                z.getStatus() == null ? null : z.getStatus().name(),
                z.getRegion() == null ? null : z.getRegion().getId(),
                z.getZoneType() == null ? null : z.getZoneType().getId(),
                z.getActivities() == null ? List.of() : z.getActivities().stream().map(a -> a.getActivity().getId()).toList(),
                z.getAmenities() == null ? List.of() : z.getAmenities().stream().map(a -> a.getAmenity().getId()).toList(),
                vertices,
                z.getLatitude(),  // Utiliser les coordonnées pré-calculées
                z.getLongitude()  // Utiliser les coordonnées pré-calculées
        );
    }

    private void updateEntity(Zone z, ZoneDto dto) {
        System.out.println("DEBUG: updateEntity appelé pour zone " + z.getId());
        z.setName(dto.name());
        z.setDescription(dto.description());
        z.setAddress(dto.address());
        z.setTotalArea(dto.totalArea());
        z.setPrice(dto.price());
        if (dto.status() != null) {
            z.setStatus(ZoneStatus.valueOf(dto.status()));
        }
        if (dto.zoneTypeId() != null)
            z.setZoneType(zoneTypeRepository.findById(dto.zoneTypeId()).orElse(null));
        if (dto.regionId() != null)
            z.setRegion(regionRepository.findById(dto.regionId()).orElse(null));
        z.setGeometry(buildGeometry(dto.vertices()));
        z.setSrid(4326);
        
        System.out.println("DEBUG: Vertices reçus: " + dto.vertices());
        // Calculer automatiquement les coordonnées WGS84
        geometryUpdateService.updateZoneCoordinates(z, dto.vertices());

        if (z.getActivities() != null && !z.getActivities().isEmpty()) {
            zoneActivityRepository.deleteAll(z.getActivities());
            z.getActivities().clear();
        }
        if (z.getAmenities() != null && !z.getAmenities().isEmpty()) {
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
