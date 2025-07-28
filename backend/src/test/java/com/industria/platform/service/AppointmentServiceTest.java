package com.industria.platform.service;

import com.industria.platform.entity.Appointment;
import com.industria.platform.entity.Parcel;
import com.industria.platform.entity.ParcelStatus;
import com.industria.platform.exception.BusinessRuleException;
import com.industria.platform.repository.AppointmentRepository;
import com.industria.platform.repository.ParcelRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class AppointmentServiceTest {

    private AppointmentRepository appointmentRepository;
    private ParcelRepository parcelRepository;
    private AppointmentService appointmentService;

    @BeforeEach
    void setUp() {
        appointmentRepository = Mockito.mock(AppointmentRepository.class);
        parcelRepository = Mockito.mock(ParcelRepository.class);
        appointmentService = new AppointmentService(appointmentRepository, parcelRepository);
    }

    @Test
    void createAppointmentShouldFailIfParcelNotLibre() {
        Parcel parcel = Parcel.builder().id("p1").status(ParcelStatus.RESERVEE).build();
        when(parcelRepository.findById("p1")).thenReturn(Optional.of(parcel));
        Appointment a = new Appointment();
        assertThrows(BusinessRuleException.class, () -> appointmentService.createAppointment(a, "p1"));
    }
}
