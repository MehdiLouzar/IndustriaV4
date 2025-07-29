package com.industria.platform.controller;

import com.industria.platform.dto.ParcelDto;
import com.industria.platform.entity.Parcel;
import com.industria.platform.entity.ParcelStatus;
import com.industria.platform.repository.ParcelRepository;
import com.industria.platform.repository.ZoneRepository;
import com.industria.platform.service.StatusService;
import java.util.List;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/parcels")
public class ParcelController {

    private final StatusService statusService;
    private final ParcelRepository repo;
    private final ZoneRepository zoneRepo;

    public ParcelController(StatusService statusService, ParcelRepository repo, ZoneRepository zoneRepo) {
        this.statusService = statusService;
        this.repo = repo;
        this.zoneRepo = zoneRepo;
    }

    @PutMapping("/{id}/status")
    @PreAuthorize("hasRole('ZONE_MANAGER') or hasRole('CONTENT_MANAGER') or hasRole('ADMIN')")
    public Parcel updateStatus(@PathVariable String id, @RequestBody StatusRequest request) {
        return statusService.updateParcelStatus(id, request.status());
    }

    @GetMapping
    public List<ParcelDto> all() {
        return repo.findAll().stream().map(this::toDto).toList();
    }

    @GetMapping("/{id}")
    public ParcelDto get(@PathVariable String id) {
        return repo.findById(id).map(this::toDto).orElse(null);
    }

    @PostMapping
    public ParcelDto create(@RequestBody ParcelDto dto) {
        Parcel p = new Parcel();
        updateEntity(p, dto);
        repo.save(p);
        return toDto(p);
    }

    @PutMapping("/{id}")
    public ParcelDto update(@PathVariable String id, @RequestBody ParcelDto dto) {
        Parcel p = repo.findById(id).orElseThrow();
        updateEntity(p, dto);
        repo.save(p);
        return toDto(p);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable String id) { repo.deleteById(id); }

    private void updateEntity(Parcel p, ParcelDto dto) {
        p.setReference(dto.reference());
        p.setArea(dto.area());
        p.setStatus(dto.status() == null ? null : ParcelStatus.valueOf(dto.status()));
        p.setIsShowroom(dto.isShowroom());
        if (dto.zoneId() != null)
            p.setZone(zoneRepo.findById(dto.zoneId()).orElse(null));
    }

    private ParcelDto toDto(Parcel p) {
        return new ParcelDto(p.getId(), p.getReference(), p.getArea(),
                p.getStatus() == null ? null : p.getStatus().name(),
                p.getIsShowroom(),
                p.getZone() == null ? null : p.getZone().getId());
    }

    public record StatusRequest(ParcelStatus status) {}
}
