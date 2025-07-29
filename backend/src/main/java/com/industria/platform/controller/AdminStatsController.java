package com.industria.platform.controller;

import com.industria.platform.dto.AdminStatsDto;
import com.industria.platform.repository.AppointmentRepository;
import com.industria.platform.repository.ParcelRepository;
import com.industria.platform.repository.UserRepository;
import com.industria.platform.repository.ZoneRepository;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin")
public class AdminStatsController {
    private final ZoneRepository zoneRepo;
    private final ParcelRepository parcelRepo;
    private final AppointmentRepository apptRepo;
    private final UserRepository userRepo;

    public AdminStatsController(ZoneRepository zoneRepo, ParcelRepository parcelRepo,
                                AppointmentRepository apptRepo, UserRepository userRepo) {
        this.zoneRepo = zoneRepo;
        this.parcelRepo = parcelRepo;
        this.apptRepo = apptRepo;
        this.userRepo = userRepo;
    }

    @GetMapping("/stats")
    public AdminStatsDto stats() {
        return new AdminStatsDto(zoneRepo.count(), parcelRepo.count(), apptRepo.count(), userRepo.count());
    }
}
