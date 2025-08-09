package com.industria.platform.controller;

import com.industria.platform.dto.AppointmentDto;
import com.industria.platform.entity.Appointment;
import com.industria.platform.entity.AppointmentStatus;
import com.industria.platform.repository.AppointmentRepository;
import com.industria.platform.repository.ParcelRepository;
import com.industria.platform.service.AppointmentService;
import com.industria.platform.service.PermissionService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@RestController
@RequestMapping("/api")
public class AppointmentController {

    private final AppointmentService appointmentService;
    private final AppointmentRepository appointmentRepository;
    private final ParcelRepository parcelRepository;
    private final PermissionService permissionService;

    public AppointmentController(AppointmentService appointmentService,
                                 AppointmentRepository appointmentRepository,
                                 ParcelRepository parcelRepository,
                                 PermissionService permissionService) {
        this.appointmentService = appointmentService;
        this.appointmentRepository = appointmentRepository;
        this.parcelRepository = parcelRepository;
        this.permissionService = permissionService;
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
    public List<AppointmentDto> all(Authentication authentication) {
        DateTimeFormatter fmt = DateTimeFormatter.ISO_LOCAL_DATE_TIME;
        List<Appointment> appointments = appointmentRepository.findAll();
        
        // Filtrer pour les ZONE_MANAGER : seulement leurs rendez-vous
        if (!permissionService.hasRole("ADMIN")) {
            appointments = appointments.stream()
                .filter(a -> a.getParcel() != null && permissionService.canModifyParcel(a.getParcel().getId()))
                .toList();
        }
        
        return appointments.stream().map(a -> new AppointmentDto(
                a.getId(), a.getContactName(), a.getContactEmail(), a.getContactPhone(),
                a.getCompanyName(), a.getMessage(),
                a.getRequestedDate() == null ? null : a.getRequestedDate().format(fmt),
                a.getParcel() == null ? null : a.getParcel().getId(),
                a.getStatus() == null ? null : a.getStatus().name()
        )).toList();
    }

    @GetMapping("/appointments/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('ZONE_MANAGER')")
    public ResponseEntity<AppointmentDto> get(@PathVariable String id) {
        if (!permissionService.canManageAppointment(id)) {
            return ResponseEntity.status(403).build(); // Forbidden
        }
        
        Appointment a = appointmentRepository.findById(id).orElseThrow();
        DateTimeFormatter fmt = DateTimeFormatter.ISO_LOCAL_DATE_TIME;
        AppointmentDto dto = new AppointmentDto(a.getId(), a.getContactName(), a.getContactEmail(), a.getContactPhone(),
                a.getCompanyName(), a.getMessage(),
                a.getRequestedDate() == null ? null : a.getRequestedDate().format(fmt),
                a.getParcel() == null ? null : a.getParcel().getId(),
                a.getStatus() == null ? null : a.getStatus().name());
        return ResponseEntity.ok(dto);
    }

    @PostMapping("/appointments")
    @PreAuthorize("hasRole('ADMIN') or hasRole('ZONE_MANAGER')")
    public ResponseEntity<AppointmentDto> createAdmin(@RequestBody AppointmentDto dto) {
        // Vérifier si l'utilisateur peut gérer la parcelle
        if (dto.parcelId() != null && !permissionService.canModifyParcel(dto.parcelId())) {
            return ResponseEntity.status(403).build(); // Forbidden
        }
        
        Appointment a = new Appointment();
        updateEntity(a, dto);
        if (dto.parcelId() != null)
            a.setParcel(parcelRepository.findById(dto.parcelId()).orElse(null));
        appointmentRepository.save(a);
        
        DateTimeFormatter fmt = DateTimeFormatter.ISO_LOCAL_DATE_TIME;
        AppointmentDto createdDto = new AppointmentDto(a.getId(), a.getContactName(), a.getContactEmail(), a.getContactPhone(),
                a.getCompanyName(), a.getMessage(),
                a.getRequestedDate() == null ? null : a.getRequestedDate().format(fmt),
                a.getParcel() == null ? null : a.getParcel().getId(),
                a.getStatus() == null ? null : a.getStatus().name());
        return ResponseEntity.ok(createdDto);
    }

    @PutMapping("/appointments/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('ZONE_MANAGER')")
    public ResponseEntity<AppointmentDto> update(@PathVariable String id, @RequestBody AppointmentDto dto) {
        if (!permissionService.canManageAppointment(id)) {
            return ResponseEntity.status(403).build(); // Forbidden
        }
        
        Appointment a = appointmentRepository.findById(id).orElseThrow();
        updateEntity(a, dto);
        if (dto.parcelId() != null)
            a.setParcel(parcelRepository.findById(dto.parcelId()).orElse(null));
        appointmentRepository.save(a);
        
        DateTimeFormatter fmt = DateTimeFormatter.ISO_LOCAL_DATE_TIME;
        AppointmentDto updatedDto = new AppointmentDto(a.getId(), a.getContactName(), a.getContactEmail(), a.getContactPhone(),
                a.getCompanyName(), a.getMessage(),
                a.getRequestedDate() == null ? null : a.getRequestedDate().format(fmt),
                a.getParcel() == null ? null : a.getParcel().getId(),
                a.getStatus() == null ? null : a.getStatus().name());
        return ResponseEntity.ok(updatedDto);
    }

    @PutMapping("/appointments/{id}/status")
    @PreAuthorize("hasRole('ADMIN') or hasRole('ZONE_MANAGER')")
    public ResponseEntity<AppointmentDto> updateStatus(@PathVariable String id, @RequestBody UpdateStatusRequest request) {
        if (!permissionService.canManageAppointment(id)) {
            return ResponseEntity.status(403).build(); // Forbidden
        }
        
        Appointment updatedAppointment = appointmentService.updateAppointmentStatus(id, request.status(), request.notes());
        
        DateTimeFormatter fmt = DateTimeFormatter.ISO_LOCAL_DATE_TIME;
        AppointmentDto updatedDto = new AppointmentDto(
                updatedAppointment.getId(), 
                updatedAppointment.getContactName(), 
                updatedAppointment.getContactEmail(), 
                updatedAppointment.getContactPhone(),
                updatedAppointment.getCompanyName(), 
                updatedAppointment.getMessage(),
                updatedAppointment.getRequestedDate() == null ? null : updatedAppointment.getRequestedDate().format(fmt),
                updatedAppointment.getParcel() == null ? null : updatedAppointment.getParcel().getId(),
                updatedAppointment.getStatus() == null ? null : updatedAppointment.getStatus().name());
        return ResponseEntity.ok(updatedDto);
    }

    @DeleteMapping("/appointments/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('ZONE_MANAGER')")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        if (!permissionService.canManageAppointment(id)) {
            return ResponseEntity.status(403).build(); // Forbidden
        }
        
        appointmentRepository.deleteById(id);
        return ResponseEntity.ok().build();
    }

    private void updateEntity(Appointment a, AppointmentDto dto) {
        a.setContactName(dto.contactName());
        a.setContactEmail(dto.contactEmail());
        a.setContactPhone(dto.contactPhone());
        a.setCompanyName(dto.companyName());
        a.setMessage(dto.message());
        
        // Traitement de la date
        if (dto.requestedDate() != null && !dto.requestedDate().trim().isEmpty()) {
            try {
                // Si c'est juste une date (YYYY-MM-DD), ajouter une heure par défaut
                String dateStr = dto.requestedDate().trim();
                if (dateStr.length() == 10) { // Format date seulement
                    dateStr = dateStr + "T09:00:00"; // 9h par défaut
                }
                a.setRequestedDate(LocalDateTime.parse(dateStr));
            } catch (Exception e) {
                System.err.println("Erreur lors du parsing de la date: " + dto.requestedDate() + " - " + e.getMessage());
                a.setRequestedDate(null);
            }
        } else {
            a.setRequestedDate(null);
        }
    }

    public record AppointmentRequest(String parcelId, String contactName, String contactEmail, String contactPhone) {}
    
    public record UpdateStatusRequest(AppointmentStatus status, String notes) {}
}
