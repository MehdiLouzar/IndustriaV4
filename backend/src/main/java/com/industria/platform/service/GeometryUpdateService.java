package com.industria.platform.service;

import com.industria.platform.dto.VertexDto;
import com.industria.platform.entity.Zone;
import com.industria.platform.entity.Parcel;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Service de mise à jour des coordonnées géospatiales.
 * 
 * Calcule et met à jour automatiquement les coordonnées WGS84 des zones
 * et parcelles à partir de leurs vertices en projection Lambert Maroc.
 * 
 * @author Industria Platform Team
 * @version 1.0
 * @since 1.0
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class GeometryUpdateService {

    private final CoordinateCalculationService coordinateCalculationService;

    /**
     * Met à jour les coordonnées WGS84 d'une zone basées sur ses vertices.
     * 
     * Calcule le centroïde de la zone à partir des vertices en Lambert Maroc
     * et effectue la conversion automatique en WGS84 pour l'affichage web.
     * 
     * @param zone zone à mettre à jour
     * @param vertices liste des points géométriques en Lambert Maroc
     */
    public void updateZoneCoordinates(Zone zone, List<VertexDto> vertices) {
        if (zone == null) return;
            
        if (vertices != null && !vertices.isEmpty()) {
            double[] wgs84Coords = coordinateCalculationService.calculateCentroidWGS84(vertices);
            log.debug("Zone {} - Coordonnées calculées: lon={}, lat={}", zone.getId(), wgs84Coords[0], wgs84Coords[1]);
            
            // Valider les coordonnées calculées
            if (coordinateCalculationService.validateWGS84Coordinates(wgs84Coords[0], wgs84Coords[1])) {
                zone.setLongitude(wgs84Coords[0]);
                zone.setLatitude(wgs84Coords[1]);
                log.debug("Coordonnées WGS84 validées et enregistrées pour zone {}", zone.getId());
            } else {
                // Log l'erreur mais ne pas bloquer l'opération
                log.error("Coordonnées WGS84 invalides pour la zone {}: lon={}, lat={}", 
                         zone.getId(), wgs84Coords[0], wgs84Coords[1]);
                zone.setLongitude(null);
                zone.setLatitude(null);
            }
        } else {
            // Pas de vertices, réinitialiser les coordonnées
            zone.setLongitude(null);
            zone.setLatitude(null);
        }
    }

    /**
     * Met à jour les coordonnées WGS84 d'une parcelle basées sur ses vertices.
     * 
     * Calcule le centroïde de la parcelle à partir des vertices en Lambert Maroc
     * et effectue la conversion automatique en WGS84 pour l'affichage web.
     * 
     * @param parcel parcelle à mettre à jour
     * @param vertices liste des points géométriques en Lambert Maroc
     */
    public void updateParcelCoordinates(Parcel parcel, List<VertexDto> vertices) {
        if (parcel == null) return;
            
        if (vertices != null && !vertices.isEmpty()) {
            double[] wgs84Coords = coordinateCalculationService.calculateCentroidWGS84(vertices);
            
            // Valider les coordonnées calculées
            if (coordinateCalculationService.validateWGS84Coordinates(wgs84Coords[0], wgs84Coords[1])) {
                parcel.setLongitude(wgs84Coords[0]);
                parcel.setLatitude(wgs84Coords[1]);
            } else {
                // Log l'erreur mais ne pas bloquer l'opération
                log.error("Coordonnées WGS84 invalides pour la parcelle {}: lon={}, lat={}", 
                         parcel.getId(), wgs84Coords[0], wgs84Coords[1]);
                parcel.setLongitude(null);
                parcel.setLatitude(null);
            }
        } else {
            // Pas de vertices, réinitialiser les coordonnées
            parcel.setLongitude(null);
            parcel.setLatitude(null);
        }
    }
}