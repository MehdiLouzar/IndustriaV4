package com.industria.platform.service;

import com.industria.platform.entity.*;
import com.industria.platform.repository.ParcelRepository;
import com.industria.platform.repository.ZoneRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Set;

/**
 * Service de gestion des statuts des zones et parcelles.
 * 
 * Gère les transitions d'état avec propagation automatique
 * des statuts entre zones et leurs parcelles associées.
 * 
 * @author Industria Platform Team
 * @version 1.0
 * @since 1.0
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class StatusService {

    private final ZoneRepository zoneRepository;
    private final ParcelRepository parcelRepository;

    /**
     * Met à jour le statut d'une zone.
     * 
     * Propage automatiquement le statut aux parcelles de la zone
     * pour certains statuts (EN_DEVELOPPEMENT, LIBRE).
     * 
     * @param zoneId identifiant de la zone
     * @param newStatus nouveau statut de la zone
     * @return la zone mise à jour
     */
    @Transactional
    public Zone updateZoneStatus(String zoneId, ZoneStatus newStatus) {
        Zone zone = zoneRepository.findById(zoneId).orElseThrow();
        zone.setStatus(newStatus);
        zoneRepository.save(zone);

        if (newStatus == ZoneStatus.EN_DEVELOPPEMENT || newStatus == ZoneStatus.LIBRE) {
            Set<Parcel> parcels = parcelRepository.findByZoneId(zoneId);
            for (Parcel parcel : parcels) {
                parcel.setStatus(newStatus == ZoneStatus.LIBRE ? ParcelStatus.LIBRE : ParcelStatus.EN_DEVELOPPEMENT);
                parcelRepository.save(parcel);
            }
        }
        return zone;
    }

    /**
     * Met à jour le statut d'une parcelle.
     * 
     * Récalcule automatiquement le statut de la zone parente
     * en fonction du statut de toutes ses parcelles.
     * 
     * @param parcelId identifiant de la parcelle
     * @param newStatus nouveau statut de la parcelle
     * @return la parcelle mise à jour
     */
    @Transactional
    public Parcel updateParcelStatus(String parcelId, ParcelStatus newStatus) {
        Parcel parcel = parcelRepository.findById(parcelId).orElseThrow();
        parcel.setStatus(newStatus);
        parcelRepository.save(parcel);

        Zone zone = parcel.getZone();
        if (zone != null) {
            Set<Parcel> parcels = parcelRepository.findByZoneId(zone.getId());
            boolean allReserved = parcels.stream().allMatch(p -> p.getStatus() == ParcelStatus.RESERVEE);
            boolean allSold = parcels.stream().allMatch(p -> p.getStatus() == ParcelStatus.VENDU);
            boolean allUnavailable = parcels.stream().allMatch(p -> p.getStatus() == ParcelStatus.INDISPONIBLE);
            if (allReserved) zone.setStatus(ZoneStatus.RESERVEE);
            else if (allSold) zone.setStatus(ZoneStatus.VENDU);
            else if (allUnavailable) zone.setStatus(ZoneStatus.INDISPONIBLE);
            else if (parcels.stream().noneMatch(p -> p.getStatus() == ParcelStatus.LIBRE)) {
                // keep zone status
            } else {
                zone.setStatus(ZoneStatus.LIBRE);
            }
            zoneRepository.save(zone);
        }
        return parcel;
    }
}
