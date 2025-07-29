package com.industria.platform.controller;

import com.industria.platform.entity.Appointment;
import com.industria.platform.repository.AppointmentRepository;
import com.industria.platform.repository.ParcelRepository;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/appointments")
public class AppointmentAdminController {
    private final AppointmentRepository repo;
    private final ParcelRepository parcelRepo;

    public AppointmentAdminController(AppointmentRepository repo, ParcelRepository parcelRepo) {
        this.repo = repo;
        this.parcelRepo = parcelRepo;
    }

    @GetMapping
    public List<Appointment> all() { return repo.findAll(); }

    @GetMapping("/{id}")
    public Appointment get(@PathVariable String id) { return repo.findById(id).orElse(null); }

    @PostMapping
    public Appointment create(@RequestBody Appointment appt) {
        if (appt.getParcel() != null && appt.getParcel().getId() != null) {
            appt.setParcel(parcelRepo.findById(appt.getParcel().getId()).orElse(null));
        }
        return repo.save(appt);
    }

    @PutMapping("/{id}")
    public Appointment update(@PathVariable String id, @RequestBody Appointment appt) {
        Appointment a = repo.findById(id).orElseThrow();
        a.setContactName(appt.getContactName());
        a.setContactEmail(appt.getContactEmail());
        a.setContactPhone(appt.getContactPhone());
        a.setCompanyName(appt.getCompanyName());
        a.setMessage(appt.getMessage());
        a.setRequestedDate(appt.getRequestedDate());
        a.setStatus(appt.getStatus());
        if (appt.getParcel() != null && appt.getParcel().getId() != null)
            a.setParcel(parcelRepo.findById(appt.getParcel().getId()).orElse(null));
        return repo.save(a);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable String id) { repo.deleteById(id); }
}
