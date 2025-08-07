package com.industria.platform.controller;

import com.industria.platform.dto.ParcelFeatureDto;
import com.industria.platform.dto.ZoneFeatureDto;
import com.industria.platform.dto.ZoneSimplifiedFeatureDto;
import com.industria.platform.entity.Parcel;
import com.industria.platform.entity.ParcelStatus;
import com.industria.platform.entity.Zone;
import com.industria.platform.repository.ParcelRepository;
import com.industria.platform.repository.ZoneRepository;
import com.industria.platform.service.CoordinateCalculationService;
import org.locationtech.jts.geom.Coordinate;
import org.locationtech.jts.geom.Geometry;
import org.locationtech.jts.io.WKTReader;
import org.locationtech.jts.simplify.DouglasPeuckerSimplifier;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.concurrent.ConcurrentHashMap;

@RestController
@RequestMapping("/api/map")
public class MapController {
    private final ZoneRepository zoneRepository;
    private final ParcelRepository parcelRepository;
    private final CoordinateCalculationService coordinateService;
    private final Map<Integer, List<ZoneSimplifiedFeatureDto>> simplifiedCache = new ConcurrentHashMap<>();

    public MapController(ZoneRepository zoneRepository,
                         ParcelRepository parcelRepository,
                         CoordinateCalculationService coordinateService) {
        this.zoneRepository = zoneRepository;
        this.parcelRepository = parcelRepository;
        this.coordinateService = coordinateService;
    }

    @GetMapping("/zones")
    public MapResponse<ZoneFeatureDto> zones() {
        List<ZoneFeatureDto> features = zoneRepository.findAll().stream().map(z ->
                new ZoneFeatureDto(parseCentroid(z.getGeometry()), z.getId(), z.getName(),
                        z.getStatus().name(),
                        parcelRepository.countByZoneIdAndStatus(z.getId(), ParcelStatus.LIBRE),
                        z.getActivities() == null ? List.of() : z.getActivities().stream().map(a -> a.getActivity().getIcon()).toList(),
                        z.getAmenities() == null ? List.of() : z.getAmenities().stream().map(a -> a.getAmenity().getIcon()).toList())
        ).toList();
        return new MapResponse<>(features);
    }

    @GetMapping("/parcels")
    public MapResponse<ParcelFeatureDto> parcels() {
        List<ParcelFeatureDto> features = parcelRepository.findAll().stream().map(p ->
                new ParcelFeatureDto(parseCentroid(p.getGeometry()), p.getId(), p.getReference(),
                        Boolean.TRUE.equals(p.getIsShowroom()), p.getStatus().name())
        ).toList();
        return new MapResponse<>(features);
    }

    @GetMapping("/zones/simplified")
    public MapResponse<ZoneSimplifiedFeatureDto> simplifiedZones(@RequestParam(defaultValue = "6") int zoom) {
        List<ZoneSimplifiedFeatureDto> features = simplifiedCache.computeIfAbsent(zoom, this::buildSimplifiedZones);
        return new MapResponse<>(features);
    }

    private List<ZoneSimplifiedFeatureDto> buildSimplifiedZones(int zoom) {
        double tolerance = zoomToTolerance(zoom);
        WKTReader reader = new WKTReader();
        return zoneRepository.findAll().stream().map(z -> {
            try {
                Geometry geom = reader.read(z.getGeometry());
                Geometry simplified = DouglasPeuckerSimplifier.simplify(geom, tolerance);
                List<double[]> coords = new ArrayList<>();
                for (Coordinate c : simplified.getCoordinates()) {
                    double[] wgs = coordinateService.lambertToWGS84(c.getX(), c.getY());
                    coords.add(new double[]{wgs[1], wgs[0]}); // lat, lon
                }
                return new ZoneSimplifiedFeatureDto(
                        coords,
                        z.getId(),
                        z.getName(),
                        z.getStatus().name(),
                        parcelRepository.countByZoneIdAndStatus(z.getId(), ParcelStatus.LIBRE),
                        z.getActivities() == null ? List.of() : z.getActivities().stream().map(a -> a.getActivity().getIcon()).toList(),
                        z.getAmenities() == null ? List.of() : z.getAmenities().stream().map(a -> a.getAmenity().getIcon()).toList()
                );
            } catch (Exception e) {
                return null;
            }
        }).filter(Objects::nonNull).toList();
    }

    private double zoomToTolerance(int zoom) {
        if (zoom >= 15) return 5;
        if (zoom >= 12) return 20;
        if (zoom >= 10) return 50;
        if (zoom >= 8) return 100;
        return 200;
    }

    private double[] parseCentroid(String wkt) {
        if (wkt == null) return new double[]{0,0};
        String numbers = wkt.replaceAll("[^0-9.\\- ]", " ");
        String[] parts = numbers.trim().split(" +");
        double sumX=0,sumY=0; int count=0;
        for(int i=0;i+1<parts.length;i+=2){
            sumX+=Double.parseDouble(parts[i]);
            sumY+=Double.parseDouble(parts[i+1]);
            count++;}
        if(count==0) return new double[]{0,0};
        return new double[]{sumX/count,sumY/count};
    }

    public record MapResponse<T>(List<T> features) {}
}
