package com.industria.platform.service;

import com.industria.platform.dto.VertexDto;
import com.industria.platform.entity.Zone;
import com.industria.platform.entity.Parcel;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class GeometryUpdateService {

    @Autowired
    private CoordinateCalculationService coordinateCalculationService;

    /**
     * Met à jour les coordonnées WGS84 d'une zone basées sur ses vertices
     */
    public void updateZoneCoordinates(Zone zone, List<VertexDto> vertices) {
        if (zone == null) return;
            
        if (vertices != null && !vertices.isEmpty()) {
            double[] wgs84Coords = coordinateCalculationService.calculateCentroidWGS84(vertices);
            System.out.println("DEBUG: Zone " + zone.getId() + " - Coordonnées calculées: lon=" + wgs84Coords[0] + ", lat=" + wgs84Coords[1]);
            
            // Valider les coordonnées calculées
            if (coordinateCalculationService.validateWGS84Coordinates(wgs84Coords[0], wgs84Coords[1])) {
                zone.setLongitude(wgs84Coords[0]);
                zone.setLatitude(wgs84Coords[1]);
                System.out.println("DEBUG: Coordonnées WGS84 validées et enregistrées pour zone " + zone.getId());
            } else {
                // Log l'erreur mais ne pas bloquer l'opération
                System.err.println("Coordonnées WGS84 invalides pour la zone " + zone.getId() + 
                                 ": lon=" + wgs84Coords[0] + ", lat=" + wgs84Coords[1]);
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
     * Met à jour les coordonnées WGS84 d'une parcelle basées sur ses vertices
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
                System.err.println("Coordonnées WGS84 invalides pour la parcelle " + parcel.getId() + 
                                 ": lon=" + wgs84Coords[0] + ", lat=" + wgs84Coords[1]);
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