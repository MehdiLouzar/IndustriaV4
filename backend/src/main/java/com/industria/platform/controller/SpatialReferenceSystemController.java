package com.industria.platform.controller;

import com.industria.platform.dto.ListResponse;
import com.industria.platform.dto.SpatialReferenceSystemDto;
import com.industria.platform.entity.SpatialReferenceSystem;
import com.industria.platform.exception.EntityNotFoundException;
import com.industria.platform.repository.SpatialReferenceSystemRepository;
import com.industria.platform.service.AuditService;
import com.industria.platform.entity.AuditAction;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Contrôleur REST pour la gestion des systèmes de référence spatiale.
 * 
 * Gère les opérations CRUD sur les systèmes de coordonnées géographiques
 * utilisés dans l'application pour les conversions géospatiales.
 * 
 * @author Industria Platform Team
 * @version 1.0
 * @since 1.0
 */
@RestController
@RequestMapping("/api/spatial-reference-systems")
@RequiredArgsConstructor
@Slf4j
public class SpatialReferenceSystemController {

    private final SpatialReferenceSystemRepository spatialReferenceSystemRepository;
    private final AuditService auditService;

    @GetMapping
    public ListResponse<SpatialReferenceSystemDto> all(@RequestParam(defaultValue = "1") int page,
                                                        @RequestParam(defaultValue = "10") int limit,
                                                        @RequestParam(required = false) String search) {
        log.debug("Fetching spatial reference systems - page: {}, limit: {}, search: {}", page, limit, search);

        int p = Math.max(1, page);
        int l = Math.min(Math.max(1, limit), 100);
        
        List<SpatialReferenceSystem> allSystems;
        
        if (search != null && !search.trim().isEmpty()) {
            var searchPageable = PageRequest.of(0, Integer.MAX_VALUE);
            allSystems = spatialReferenceSystemRepository.findByNameContainingIgnoreCaseOrDescriptionContainingIgnoreCase(
                search.trim(), search.trim(), searchPageable).getContent();
        } else {
            allSystems = spatialReferenceSystemRepository.findAll();
        }
        
        // Filtrer les systèmes non supprimés
        var activeSystems = allSystems.stream()
            .filter(srs -> srs.getDeletedAt() == null)
            .toList();
        
        long totalFiltered = activeSystems.size();
        int totalPagesFiltered = (int) Math.ceil((double) totalFiltered / l);
        
        int startIndex = (p - 1) * l;
        int endIndex = Math.min(startIndex + l, (int) totalFiltered);
        
        List<SpatialReferenceSystem> paginatedSystems = startIndex < totalFiltered ? 
            activeSystems.subList(startIndex, endIndex) : List.of();
            
        var items = paginatedSystems.stream().map(this::toDto).toList();
        
        return new ListResponse<>(items, totalFiltered, totalPagesFiltered, p, l);
    }

    @GetMapping("/all")
    public List<SpatialReferenceSystemDto> allSystems() {
        log.debug("Loading all spatial reference systems");
        List<SpatialReferenceSystem> systems = spatialReferenceSystemRepository.findAll()
            .stream()
            .filter(srs -> srs.getDeletedAt() == null)
            .toList();
        
        return systems.stream().map(this::toDto).toList();
    }

    @GetMapping("/{id}")
    public SpatialReferenceSystemDto get(@PathVariable String id) {
        SpatialReferenceSystem srs = spatialReferenceSystemRepository.findById(id)
            .filter(s -> s.getDeletedAt() == null)
            .orElseThrow(() -> new EntityNotFoundException("SpatialReferenceSystem", id));
        return toDto(srs);
    }
    
    @GetMapping("/check-name")
    public ResponseEntity<CheckNameResponse> checkName(@RequestParam String name) {
        log.debug("Checking if spatial reference system name exists: {}", name);
        boolean exists = spatialReferenceSystemRepository.existsByNameIgnoreCase(name.trim());
        return ResponseEntity.ok(new CheckNameResponse(exists));
    }
    
    @GetMapping("/check-srid")
    public ResponseEntity<CheckSridResponse> checkSrid(@RequestParam Integer srid) {
        log.debug("Checking if SRID exists: {}", srid);
        boolean exists = spatialReferenceSystemRepository.existsBySrid(srid);
        return ResponseEntity.ok(new CheckSridResponse(exists));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public SpatialReferenceSystemDto create(@RequestBody SpatialReferenceSystemDto dto) {
        log.info("Creating spatial reference system: {}", dto.name());
        
        SpatialReferenceSystem srs = new SpatialReferenceSystem();
        updateEntity(srs, dto);
        
        SpatialReferenceSystem saved = spatialReferenceSystemRepository.save(srs);
        
        auditService.log(AuditAction.CREATE, "SpatialReferenceSystem", saved.getId(), 
            null, saved, 
            "Création du système de référence spatiale: " + saved.getName());
        
        return toDto(saved);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<SpatialReferenceSystemDto> update(@PathVariable String id, @RequestBody SpatialReferenceSystemDto dto) {
        log.info("Updating spatial reference system: {}", id);
        
        SpatialReferenceSystem oldSrs = spatialReferenceSystemRepository.findById(id)
            .filter(s -> s.getDeletedAt() == null)
            .orElseThrow(() -> new EntityNotFoundException("SpatialReferenceSystem", id));
        
        SpatialReferenceSystem srsClone = new SpatialReferenceSystem();
        srsClone.setName(oldSrs.getName());
        srsClone.setDescription(oldSrs.getDescription());
        srsClone.setSrid(oldSrs.getSrid());
        srsClone.setProj4text(oldSrs.getProj4text());
        
        updateEntity(oldSrs, dto);
        spatialReferenceSystemRepository.save(oldSrs);
        
        auditService.log(AuditAction.UPDATE, "SpatialReferenceSystem", id, 
            srsClone, oldSrs, 
            "Modification du système de référence spatiale: " + oldSrs.getName());
        
        return ResponseEntity.ok(toDto(oldSrs));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        log.info("Deleting spatial reference system: {}", id);
        
        SpatialReferenceSystem srs = spatialReferenceSystemRepository.findById(id)
            .filter(s -> s.getDeletedAt() == null)
            .orElseThrow(() -> new EntityNotFoundException("SpatialReferenceSystem", id));
        
        // Soft delete
        srs.setDeletedAt(java.time.LocalDateTime.now());
        spatialReferenceSystemRepository.save(srs);
        
        auditService.log(AuditAction.DELETE, "SpatialReferenceSystem", id, 
            srs, null, 
            "Suppression du système de référence spatiale: " + srs.getName());
        
        return ResponseEntity.ok().build();
    }

    private SpatialReferenceSystemDto toDto(SpatialReferenceSystem srs) {
        return new SpatialReferenceSystemDto(
            srs.getId(),
            srs.getName(),
            srs.getSrid(),
            srs.getProj4text(),
            srs.getDescription(),
            srs.getCreatedAt(),
            srs.getUpdatedAt()
        );
    }

    private void updateEntity(SpatialReferenceSystem srs, SpatialReferenceSystemDto dto) {
        srs.setName(dto.name());
        srs.setSrid(dto.srid());
        srs.setProj4text(dto.proj4text());
        srs.setDescription(dto.description());
    }

    public record CheckNameResponse(boolean exists) {}
    public record CheckSridResponse(boolean exists) {}
}