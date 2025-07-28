package com.industria.platform.controller;

import com.industria.platform.entity.Appointment;
import com.industria.platform.service.AppointmentService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/public/appointments")
public class AppointmentController {

    private final AppointmentService appointmentService;

    public AppointmentController(AppointmentService appointmentService) {
        this.appointmentService = appointmentService;
    }

    @PostMapping
    public Appointment create(@RequestBody AppointmentRequest request) {
        Appointment appointment = new Appointment();
        appointment.setContactName(request.contactName());
        appointment.setContactEmail(request.contactEmail());
        appointment.setContactPhone(request.contactPhone());
        return appointmentService.createAppointment(appointment, request.parcelId());
    }

    public record AppointmentRequest(String parcelId, String contactName, String contactEmail, String contactPhone) {}
}
