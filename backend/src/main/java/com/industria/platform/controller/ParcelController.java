package com.industria.platform.controller;

import com.industria.platform.entity.Parcel;
import com.industria.platform.entity.ParcelStatus;
import com.industria.platform.service.StatusService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/parcels")
public class ParcelController {

    private final StatusService statusService;

    public ParcelController(StatusService statusService) {
        this.statusService = statusService;
    }

    @PutMapping("/{id}/status")
    @PreAuthorize("hasRole('ZONE_MANAGER') or hasRole('CONTENT_MANAGER') or hasRole('ADMIN')")
    public Parcel updateStatus(@PathVariable String id, @RequestBody StatusRequest request) {
        return statusService.updateParcelStatus(id, request.status());
    }

    public record StatusRequest(ParcelStatus status) {}
}
