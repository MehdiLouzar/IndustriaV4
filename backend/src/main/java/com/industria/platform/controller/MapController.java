package com.industria.platform.controller;

import com.industria.platform.dto.ParcelFeatureDto;
import com.industria.platform.dto.ZoneFeatureDto;
import com.industria.platform.entity.Parcel;
import com.industria.platform.entity.Zone;
import com.industria.platform.repository.ParcelRepository;
import com.industria.platform.repository.ZoneRepository;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/map")
public class MapController {
    private final ZoneRepository zoneRepository;
    private final ParcelRepository parcelRepository;

    public MapController(ZoneRepository zoneRepository, ParcelRepository parcelRepository) {
        this.zoneRepository = zoneRepository;
        this.parcelRepository = parcelRepository;
    }

    @GetMapping("/zones")
    public MapResponse<ZoneFeatureDto> zones() {
        List<ZoneFeatureDto> features = zoneRepository.findAll().stream().map(z ->
                new ZoneFeatureDto(parseCentroid(z.getGeometry()), z.getId(), z.getName(),
                        z.getStatus().name(),
                        z.getParcels() == null ? 0 : (int) z.getParcels().stream().filter(p -> p.getStatus().name().equals("LIBRE")).count(),
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
