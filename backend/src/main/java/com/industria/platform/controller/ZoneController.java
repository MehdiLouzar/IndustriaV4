package com.industria.platform.controller;

import com.industria.platform.dto.RegionDto;
import com.industria.platform.dto.ZoneDto;
import com.industria.platform.dto.ZoneTypeDto;
import com.industria.platform.entity.Zone;
import com.industria.platform.entity.ZoneAmenity;
import com.industria.platform.entity.ZoneStatus;
import com.industria.platform.repository.ZoneRepository;
import com.industria.platform.service.StatusService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/zones")
public class ZoneController {

    private final StatusService statusService;
    private final ZoneRepository zoneRepository;

    public ZoneController(StatusService statusService, ZoneRepository zoneRepository) {
        this.statusService = statusService;
        this.zoneRepository = zoneRepository;
    }

    @PutMapping("/{id}/status")
    @PreAuthorize("hasRole('ZONE_MANAGER') or hasRole('CONTENT_MANAGER') or hasRole('ADMIN')")
    public Zone updateStatus(@PathVariable String id, @RequestBody StatusRequest request) {
        return statusService.updateZoneStatus(id, request.status());
    }

    @GetMapping
    public List<ZoneDto> all() {
        return zoneRepository.findAll().stream().map(z -> new ZoneDto(
                z.getId(),
                z.getName(),
                z.getDescription(),
                z.getTotalArea(),
                z.getPrice(),
                z.getStatus().name(),
                z.getRegion() == null ? null : new RegionDto(z.getRegion().getId(), z.getRegion().getName(), z.getRegion().getCode(), null),
                z.getZoneType() == null ? null : new ZoneTypeDto(z.getZoneType().getId(), z.getZoneType().getName()),
                z.getAmenities() == null ? List.of() : z.getAmenities().stream().map(ZoneAmenity::getAmenity).map(a -> a.getName()).toList()
        )).toList();
    }

    @GetMapping("/{id}")
    public ZoneDto get(@PathVariable String id) {
        Zone z = zoneRepository.findById(id).orElseThrow();
        return new ZoneDto(
                z.getId(), z.getName(), z.getDescription(), z.getTotalArea(), z.getPrice(), z.getStatus().name(),
                z.getRegion() == null ? null : new RegionDto(z.getRegion().getId(), z.getRegion().getName(), z.getRegion().getCode(), null),
                z.getZoneType() == null ? null : new ZoneTypeDto(z.getZoneType().getId(), z.getZoneType().getName()),
                z.getAmenities() == null ? List.of() : z.getAmenities().stream().map(ZoneAmenity::getAmenity).map(a -> a.getName()).toList()
        );
    }

    public record StatusRequest(ZoneStatus status) {}
}
