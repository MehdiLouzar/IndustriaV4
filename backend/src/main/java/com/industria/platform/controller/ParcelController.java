package com.industria.platform.controller;

import com.industria.platform.dto.ParcelDto;
import com.industria.platform.entity.Parcel;
import com.industria.platform.entity.ParcelStatus;
import com.industria.platform.entity.Zone;
import com.industria.platform.repository.ParcelRepository;
import com.industria.platform.repository.ZoneRepository;
import com.industria.platform.service.StatusService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import org.springframework.data.domain.PageRequest;
import com.industria.platform.dto.ListResponse;

@RestController
@RequestMapping("/api/parcels")
public class ParcelController {

    private final StatusService statusService;
    private final ParcelRepository parcelRepository;
    private final ZoneRepository zoneRepository;

    public ParcelController(StatusService statusService,
                             ParcelRepository parcelRepository,
                             ZoneRepository zoneRepository) {
        this.statusService = statusService;
        this.parcelRepository = parcelRepository;
        this.zoneRepository = zoneRepository;
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
    @PreAuthorize("hasRole('ADMIN')")
    public ParcelDto create(@RequestBody ParcelDto dto) {
        Parcel p = new Parcel();
        updateEntity(p, dto);
        parcelRepository.save(p);
        return toDto(p);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ParcelDto update(@PathVariable String id, @RequestBody ParcelDto dto) {
        Parcel p = parcelRepository.findById(id).orElseThrow();
        updateEntity(p, dto);
        parcelRepository.save(p);
        return toDto(p);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public void delete(@PathVariable String id) { parcelRepository.deleteById(id); }

    @PutMapping("/{id}/status")
    @PreAuthorize("hasRole('ZONE_MANAGER') or hasRole('CONTENT_MANAGER') or hasRole('ADMIN')")
    public Parcel updateStatus(@PathVariable String id, @RequestBody StatusRequest request) {
        return statusService.updateParcelStatus(id, request.status());
    }

    private ParcelDto toDto(Parcel p) {
        return new ParcelDto(p.getId(), p.getReference(), p.getArea(),
                p.getStatus() == null ? null : p.getStatus().name(), p.getIsShowroom(),
                p.getZone() == null ? null : p.getZone().getId());
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
    }

    public record StatusRequest(ParcelStatus status) {}
}
