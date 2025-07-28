package com.industria.platform.service;

import com.industria.platform.entity.*;
import com.industria.platform.repository.ParcelRepository;
import com.industria.platform.repository.ZoneRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import java.util.HashSet;
import java.util.Optional;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class StatusServiceTest {

    private ZoneRepository zoneRepository;
    private ParcelRepository parcelRepository;
    private StatusService statusService;

    @BeforeEach
    void setUp() {
        zoneRepository = Mockito.mock(ZoneRepository.class);
        parcelRepository = Mockito.mock(ParcelRepository.class);
        statusService = new StatusService(zoneRepository, parcelRepository);
    }

    @Test
    void updateParcelStatusShouldUpdateZoneWhenAllParcelsReserved() {
        Zone zone = Zone.builder().id("z1").status(ZoneStatus.LIBRE).build();
        Parcel p1 = Parcel.builder().id("p1").status(ParcelStatus.RESERVEE).zone(zone).build();
        Parcel p2 = Parcel.builder().id("p2").status(ParcelStatus.RESERVEE).zone(zone).build();
        Set<Parcel> parcels = new HashSet<>();
        parcels.add(p1); parcels.add(p2);

        when(parcelRepository.findById("p1")).thenReturn(Optional.of(p1));
        when(parcelRepository.save(any())).thenAnswer(i -> i.getArguments()[0]);
        when(parcelRepository.findByZoneId("z1")).thenReturn(parcels);
        when(zoneRepository.findById("z1")).thenReturn(Optional.of(zone));
        when(zoneRepository.save(any())).thenAnswer(i -> i.getArguments()[0]);

        statusService.updateParcelStatus("p1", ParcelStatus.RESERVEE);
        assertEquals(ZoneStatus.RESERVEE, zone.getStatus());
    }
}
