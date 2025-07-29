package com.industria.platform.controller;

import com.industria.platform.dto.*;
import com.industria.platform.entity.Zone;
import com.industria.platform.entity.ZoneAmenity;
import com.industria.platform.entity.Parcel;
import com.industria.platform.entity.ZoneStatus;
import com.industria.platform.repository.RegionRepository;
import com.industria.platform.repository.ZoneRepository;
import com.industria.platform.repository.ZoneTypeRepository;
import com.industria.platform.repository.AmenityRepository;
import com.industria.platform.service.StatusService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/zones")
public class ZoneController {

    private final StatusService statusService;
    private final ZoneRepository zoneRepository;
    private final RegionRepository regionRepository;
    private final ZoneTypeRepository zoneTypeRepository;
    private final AmenityRepository amenityRepository;

    public ZoneController(StatusService statusService, ZoneRepository zoneRepository,
                          RegionRepository regionRepository, ZoneTypeRepository zoneTypeRepository,
                          AmenityRepository amenityRepository) {
        this.statusService = statusService;
        this.zoneRepository = zoneRepository;
        this.regionRepository = regionRepository;
        this.zoneTypeRepository = zoneTypeRepository;
        this.amenityRepository = amenityRepository;
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

    @PostMapping
    public ZoneDto create(@RequestBody ZoneDto dto) {
        Zone z = new Zone();
        updateEntity(z, dto);
        zoneRepository.save(z);
        return toDto(z);
    }

    @GetMapping("/{id}")
    public ZoneDetailsDto get(@PathVariable String id) {
        Zone z = zoneRepository.findById(id).orElseThrow();
        return toDetailDto(z);
    }

    @PutMapping("/{id}")
    public ZoneDto update(@PathVariable String id, @RequestBody ZoneDto dto) {
        Zone z = zoneRepository.findById(id).orElseThrow();
        updateEntity(z, dto);
        zoneRepository.save(z);
        return toDto(z);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable String id) { zoneRepository.deleteById(id); }

    private void updateEntity(Zone z, ZoneDto dto) {
        z.setName(dto.name());
        z.setDescription(dto.description());
        z.setTotalArea(dto.totalArea());
        z.setPrice(dto.price());
        if (dto.status() != null)
            z.setStatus(ZoneStatus.valueOf(dto.status()));
        if (dto.region() != null && dto.region().id() != null)
            z.setRegion(regionRepository.findById(dto.region().id()).orElse(null));
        if (dto.zoneType() != null && dto.zoneType().id() != null)
            z.setZoneType(zoneTypeRepository.findById(dto.zoneType().id()).orElse(null));
    }

    private ZoneDto toDto(Zone z) {
        return new ZoneDto(
                z.getId(), z.getName(), z.getDescription(), z.getTotalArea(), z.getPrice(), z.getStatus().name(),
                z.getRegion() == null ? null : new RegionDto(z.getRegion().getId(), z.getRegion().getName(), z.getRegion().getCode(), null),
                z.getZoneType() == null ? null : new ZoneTypeDto(z.getZoneType().getId(), z.getZoneType().getName()),
                z.getAmenities() == null ? List.of() : z.getAmenities().stream().map(ZoneAmenity::getAmenity).map(a -> a.getName()).toList()
        );
    }

    private ZoneDetailsDto toDetailDto(Zone z) {
        List<VertexDto> verts = parseVertices(z.getGeometry());
        double[] cent = centroid(verts);
        List<ParcelDetailsDto> parcels = z.getParcels() == null ? List.of() : z.getParcels().stream()
                .map(this::toParcelDetail).toList();
        return new ZoneDetailsDto(
                z.getId(), z.getName(), z.getDescription(), z.getTotalArea(), z.getPrice(), z.getStatus().name(),
                z.getRegion() == null ? null : new RegionDto(z.getRegion().getId(), z.getRegion().getName(), z.getRegion().getCode(), null),
                z.getZoneType() == null ? null : new ZoneTypeDto(z.getZoneType().getId(), z.getZoneType().getName()),
                z.getAmenities() == null ? List.of() : z.getAmenities().stream().map(ZoneAmenity::getAmenity).map(a -> a.getName()).toList(),
                z.getActivities() == null ? List.of() : z.getActivities().stream().map(a -> a.getActivity().getName()).toList(),
                cent[1], cent[0],
                verts, parcels
        );
    }

    private ParcelDetailsDto toParcelDetail(Parcel p) {
        List<VertexDto> verts = parseVertices(p.getGeometry());
        double[] cent = centroid(verts);
        return new ParcelDetailsDto(
                p.getId(), p.getReference(), p.getArea(),
                p.getStatus() == null ? null : p.getStatus().name(),
                p.getIsShowroom(),
                verts,
                cent[1], cent[0]
        );
    }

    private List<VertexDto> parseVertices(String wkt) {
        if (wkt == null) return List.of();
        int start = wkt.indexOf("((");
        int end = wkt.indexOf("))");
        if (start < 0 || end < 0) return List.of();
        String[] parts = wkt.substring(start + 2, end).split(",");
        int seq = 0;
        List<VertexDto> list = new java.util.ArrayList<>();
        for (String part : parts) {
            String[] xy = part.trim().split("\\s+");
            if (xy.length >= 2) {
                double lon = Double.parseDouble(xy[0]);
                double lat = Double.parseDouble(xy[1]);
                list.add(new VertexDto(seq++, lat, lon));
            }
        }
        return list;
    }

    private double[] centroid(List<VertexDto> verts) {
        if (verts.isEmpty()) return new double[]{0,0};
        double sumX = 0, sumY = 0; int count = 0;
        for (VertexDto v : verts) {
            if (v.lon() != null && v.lat() != null) {
                sumX += v.lon();
                sumY += v.lat();
                count++;
            }
        }
        if (count == 0) return new double[]{0,0};
        return new double[]{sumX/count, sumY/count};
    }

    public record StatusRequest(ZoneStatus status) {}
}
