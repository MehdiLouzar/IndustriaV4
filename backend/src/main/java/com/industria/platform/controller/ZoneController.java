package com.industria.platform.controller;

import com.industria.platform.entity.Zone;
import com.industria.platform.entity.ZoneStatus;
import com.industria.platform.service.StatusService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/zones")
public class ZoneController {

    private final StatusService statusService;

    public ZoneController(StatusService statusService) {
        this.statusService = statusService;
    }

    @PutMapping("/{id}/status")
    @PreAuthorize("hasRole('ZONE_MANAGER') or hasRole('CONTENT_MANAGER') or hasRole('ADMIN')")
    public Zone updateStatus(@PathVariable String id, @RequestBody StatusRequest request) {
        return statusService.updateZoneStatus(id, request.status());
    }

    public record StatusRequest(ZoneStatus status) {}
}
