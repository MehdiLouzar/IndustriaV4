package com.industria.platform.controller;

import com.industria.platform.dto.VertexDto;
import com.industria.platform.service.CoordinateCalculationService;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/test")
public class TestController {

    private final CoordinateCalculationService coordinateCalculationService;

    public TestController(CoordinateCalculationService coordinateCalculationService) {
        this.coordinateCalculationService = coordinateCalculationService;
    }

    @PostMapping("/coordinates")
    public Map<String, Object> testCoordinates(@RequestBody List<VertexDto> vertices) {
        try {
            double[] centroidLambert = coordinateCalculationService.calculateCentroidLambert(vertices);
            double[] centroidWGS84 = coordinateCalculationService.calculateCentroidWGS84(vertices);
            boolean lambertValid = coordinateCalculationService.validateLambertCoordinates(centroidLambert[0], centroidLambert[1]);
            boolean wgs84Valid = coordinateCalculationService.validateWGS84Coordinates(centroidWGS84[0], centroidWGS84[1]);

            return Map.of(
                "vertices", vertices,
                "centroidLambert", Map.of("x", centroidLambert[0], "y", centroidLambert[1]),
                "centroidWGS84", Map.of("longitude", centroidWGS84[0], "latitude", centroidWGS84[1]),
                "validation", Map.of("lambert", lambertValid, "wgs84", wgs84Valid)
            );
        } catch (Exception e) {
            return Map.of("error", e.getMessage());
        }
    }
}