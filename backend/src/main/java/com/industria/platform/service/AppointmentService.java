package com.industria.platform.service;

import com.industria.platform.entity.Appointment;
import com.industria.platform.entity.Parcel;
import com.industria.platform.entity.ParcelStatus;
import com.industria.platform.exception.BusinessRuleException;
import com.industria.platform.repository.AppointmentRepository;
import com.industria.platform.repository.ParcelRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AppointmentService {

    private final AppointmentRepository appointmentRepository;
    private final ParcelRepository parcelRepository;

    public AppointmentService(AppointmentRepository appointmentRepository, ParcelRepository parcelRepository) {
        this.appointmentRepository = appointmentRepository;
        this.parcelRepository = parcelRepository;
    }

    @Transactional
    public Appointment createAppointment(Appointment appointment, String parcelId) {
        Parcel parcel = parcelRepository.findById(parcelId).orElseThrow();
        if (parcel.getStatus() != ParcelStatus.LIBRE) {
            throw new BusinessRuleException("Parcel not available for appointment");
        }
        appointment.setParcel(parcel);
        return appointmentRepository.save(appointment);
    }
}
