package com.industria.platform.controller;

import com.industria.platform.dto.AmenityDto;
import com.industria.platform.dto.ListResponse;
import com.industria.platform.entity.Amenity;
import com.industria.platform.repository.AmenityRepository;
import org.springframework.web.bind.annotation.*;
import org.springframework.data.domain.PageRequest;

import java.util.List;

@RestController
@RequestMapping("/api/amenities")
public class AmenityController {
    private final AmenityRepository repo;

    public AmenityController(AmenityRepository repo) { this.repo = repo; }

    @GetMapping
    public ListResponse<AmenityDto> all(@RequestParam(defaultValue = "1") int page,
                                        @RequestParam(defaultValue = "10") int limit) {
        int p = Math.max(1, page);
        int l = Math.min(Math.max(1, limit), 100);
        var res = repo.findAll(PageRequest.of(p - 1, l));
        var items = res.getContent().stream()
                .map(a -> new AmenityDto(a.getId(), a.getName(), a.getDescription(), a.getIcon(), a.getCategory()))
                .toList();
        return new ListResponse<>(items, res.getTotalElements(), res.getTotalPages(), p, l);
    }

    @GetMapping("/all")
    public List<AmenityDto> allAmenities() {
        return repo.findAll()
                .stream()
                .map(a -> new AmenityDto(a.getId(), a.getName(), a.getDescription(), a.getIcon(), a.getCategory()))
                .toList();
    }

    @GetMapping("/{id}")
    public AmenityDto get(@PathVariable String id) {
        Amenity a = repo.findById(id).orElseThrow();
        return new AmenityDto(a.getId(), a.getName(), a.getDescription(), a.getIcon(), a.getCategory());
    }

    @PostMapping
    public AmenityDto create(@RequestBody AmenityDto dto) {
        Amenity a = new Amenity();
        updateEntity(a, dto);
        repo.save(a);
        return new AmenityDto(a.getId(), a.getName(), a.getDescription(), a.getIcon(), a.getCategory());
    }

    @PutMapping("/{id}")
    public AmenityDto update(@PathVariable String id, @RequestBody AmenityDto dto) {
        Amenity a = repo.findById(id).orElseThrow();
        updateEntity(a, dto);
        repo.save(a);
        return new AmenityDto(a.getId(), a.getName(), a.getDescription(), a.getIcon(), a.getCategory());
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable String id) { repo.deleteById(id); }

    private void updateEntity(Amenity a, AmenityDto dto) {
        a.setName(dto.name());
        a.setDescription(dto.description());
        a.setIcon(dto.icon());
        a.setCategory(dto.category());
    }
}
