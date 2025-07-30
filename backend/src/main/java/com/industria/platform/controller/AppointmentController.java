package com.industria.platform.controller;

import com.industria.platform.dto.AppointmentDto;
import com.industria.platform.entity.Appointment;
import com.industria.platform.repository.AppointmentRepository;
import com.industria.platform.repository.ParcelRepository;
import com.industria.platform.service.AppointmentService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.format.DateTimeFormatter;
import java.util.List;

@RestController
@RequestMapping("/api")
public class AppointmentController {

    private final AppointmentService appointmentService;
    private final AppointmentRepository appointmentRepository;
    private final ParcelRepository parcelRepository;

    public AppointmentController(AppointmentService appointmentService,
                                 AppointmentRepository appointmentRepository,
                                 ParcelRepository parcelRepository) {
        this.appointmentService = appointmentService;
        this.appointmentRepository = appointmentRepository;
        this.parcelRepository = parcelRepository;
    }

    @PostMapping("/public/appointments")
    public Appointment create(@RequestBody AppointmentRequest request) {
        Appointment appointment = new Appointment();
        appointment.setContactName(request.contactName());
        appointment.setContactEmail(request.contactEmail());
        appointment.setContactPhone(request.contactPhone());
        return appointmentService.createAppointment(appointment, request.parcelId());
    }

    @GetMapping("/appointments")
    @PreAuthorize("hasRole('ADMIN') or hasRole('ZONE_MANAGER')")
    public List<AppointmentDto> all() {
        DateTimeFormatter fmt = DateTimeFormatter.ISO_LOCAL_DATE_TIME;
        return appointmentRepository.findAll().stream().map(a -> new AppointmentDto(
                a.getId(), a.getContactName(), a.getContactEmail(), a.getContactPhone(),
                a.getCompanyName(), a.getMessage(),
                a.getRequestedDate() == null ? null : a.getRequestedDate().format(fmt),
                a.getParcel() == null ? null : a.getParcel().getId(),
                a.getStatus() == null ? null : a.getStatus().name()
        )).toList();
    }

    @GetMapping("/appointments/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('ZONE_MANAGER')")
    public AppointmentDto get(@PathVariable String id) {
        Appointment a = appointmentRepository.findById(id).orElseThrow();
        DateTimeFormatter fmt = DateTimeFormatter.ISO_LOCAL_DATE_TIME;
        return new AppointmentDto(a.getId(), a.getContactName(), a.getContactEmail(), a.getContactPhone(),
                a.getCompanyName(), a.getMessage(),
                a.getRequestedDate() == null ? null : a.getRequestedDate().format(fmt),
                a.getParcel() == null ? null : a.getParcel().getId(),
                a.getStatus() == null ? null : a.getStatus().name());
    }

    @PostMapping("/appointments")
    @PreAuthorize("hasRole('ADMIN') or hasRole('ZONE_MANAGER')")
    public AppointmentDto createAdmin(@RequestBody AppointmentDto dto) {
        Appointment a = new Appointment();
        updateEntity(a, dto);
        if (dto.parcelId() != null)
            a.setParcel(parcelRepository.findById(dto.parcelId()).orElse(null));
        appointmentRepository.save(a);
        return get(a.getId());
    }

    @PutMapping("/appointments/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('ZONE_MANAGER')")
    public AppointmentDto update(@PathVariable String id, @RequestBody AppointmentDto dto) {
        Appointment a = appointmentRepository.findById(id).orElseThrow();
        updateEntity(a, dto);
        if (dto.parcelId() != null)
            a.setParcel(parcelRepository.findById(dto.parcelId()).orElse(null));
        appointmentRepository.save(a);
        return get(id);
    }

    @DeleteMapping("/appointments/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('ZONE_MANAGER')")
    public void delete(@PathVariable String id) { appointmentRepository.deleteById(id); }

    private void updateEntity(Appointment a, AppointmentDto dto) {
        a.setContactName(dto.contactName());
        a.setContactEmail(dto.contactEmail());
        a.setContactPhone(dto.contactPhone());
        a.setCompanyName(dto.companyName());
        a.setMessage(dto.message());
    }

    public record AppointmentRequest(String parcelId, String contactName, String contactEmail, String contactPhone) {}
}
