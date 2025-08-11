package com.industria.platform.service;

import com.industria.platform.dto.VertexDto;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class GeometryParsingService {

    /**
     * Parse une géométrie WKT (Well Known Text) en liste de vertices
     */
    public List<VertexDto> parseWKTGeometry(String wkt) {
        if (wkt == null || wkt.trim().isEmpty()) {
            return List.of();
        }
        
        List<VertexDto> vertices = new ArrayList<>();
        
        try {
            // Extraire les coordonnées du POLYGON((x1 y1, x2 y2, ...))
            String coords = wkt;
            if (coords.startsWith("POLYGON((")) {
                coords = coords.substring(9); // Remove "POLYGON(("
            }
            if (coords.endsWith("))")) {
                coords = coords.substring(0, coords.length() - 2); // Remove "))"
            }
            
            String[] coordPairs = coords.split(",");
            
            for (int i = 0; i < coordPairs.length; i++) {
                String[] xy = coordPairs[i].trim().split("\\s+");
                if (xy.length >= 2) {
                    try {
                        double x = Double.parseDouble(xy[0]);
                        double y = Double.parseDouble(xy[1]);
                        
                        // Éviter de dupliquer le premier point (qui ferme le polygone)
                        if (i == coordPairs.length - 1 && vertices.size() > 0) {
                            VertexDto firstVertex = vertices.get(0);
                            if (Math.abs(firstVertex.lambertX() - x) < 0.001 && 
                                Math.abs(firstVertex.lambertY() - y) < 0.001) {
                                break; // Skip the closing duplicate point
                            }
                        }
                        
                        vertices.add(new VertexDto(i, x, y));
                    } catch (NumberFormatException e) {
                        // Log et continuer avec les autres points
                        System.err.println("Could not parse coordinates: " + xy[0] + " " + 
                                         (xy.length > 1 ? xy[1] : ""));
                    }
                }
            }
        } catch (Exception e) {
            System.err.println("Error parsing WKT geometry: " + e.getMessage());
            return List.of();
        }
        
        return vertices;
    }
}