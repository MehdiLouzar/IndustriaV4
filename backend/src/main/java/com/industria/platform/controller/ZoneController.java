package com.industria.platform.controller;

import com.industria.platform.dto.RegionDto;
import com.industria.platform.dto.ZoneDto;
import com.industria.platform.dto.ZoneTypeDto;
import com.industria.platform.entity.Activity;
import com.industria.platform.entity.Amenity;
import com.industria.platform.entity.Zone;
import com.industria.platform.entity.ZoneActivity;
import com.industria.platform.entity.ZoneAmenity;
import com.industria.platform.entity.ZoneStatus;
import com.industria.platform.repository.ActivityRepository;
import com.industria.platform.repository.AmenityRepository;
import com.industria.platform.repository.ZoneActivityRepository;
import com.industria.platform.repository.ZoneAmenityRepository;
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
    private final ActivityRepository activityRepository;
    private final AmenityRepository amenityRepository;
    private final ZoneActivityRepository zoneActivityRepository;
    private final ZoneAmenityRepository zoneAmenityRepository;

    public ZoneController(StatusService statusService,
                          ZoneRepository zoneRepository,
                          ActivityRepository activityRepository,
                          AmenityRepository amenityRepository,
                          ZoneActivityRepository zoneActivityRepository,
                          ZoneAmenityRepository zoneAmenityRepository) {
        this.statusService = statusService;
        this.zoneRepository = zoneRepository;
        this.activityRepository = activityRepository;
        this.amenityRepository = amenityRepository;
        this.zoneActivityRepository = zoneActivityRepository;
        this.zoneAmenityRepository = zoneAmenityRepository;
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
                z.getAmenities() == null ? List.of() : z.getAmenities().stream().map(ZoneAmenity::getAmenity).map(a -> a.getName()).toList(),
                null,
                null
        )).toList();
    }

    @GetMapping("/{id}")
    public ZoneDto get(@PathVariable String id) {
        Zone z = zoneRepository.findById(id).orElseThrow();
        return new ZoneDto(
                z.getId(), z.getName(), z.getDescription(), z.getTotalArea(), z.getPrice(), z.getStatus().name(),
                z.getRegion() == null ? null : new RegionDto(z.getRegion().getId(), z.getRegion().getName(), z.getRegion().getCode(), null),
                z.getZoneType() == null ? null : new ZoneTypeDto(z.getZoneType().getId(), z.getZoneType().getName()),
                z.getAmenities() == null ? List.of() : z.getAmenities().stream().map(ZoneAmenity::getAmenity).map(a -> a.getName()).toList(),
                null,
                null
        );
    }

    private void updateEntity(Zone z, ZoneDto dto) {
        z.setName(dto.name());
        z.setDescription(dto.description());
        z.setTotalArea(dto.totalArea());
        z.setPrice(dto.price());
        if (dto.status() != null) {
            z.setStatus(ZoneStatus.valueOf(dto.status()));
        }

        // clear existing relations
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

    public record StatusRequest(ZoneStatus status) {}
}
