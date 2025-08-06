package com.industria.platform.controller;

import com.industria.platform.dto.RegionDto;
import com.industria.platform.entity.Country;
import com.industria.platform.entity.Region;
import com.industria.platform.repository.CountryRepository;
import com.industria.platform.repository.RegionRepository;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/regions")
public class RegionController {
    private final RegionRepository repo;
    private final CountryRepository countryRepo;

    public RegionController(RegionRepository repo, CountryRepository countryRepo) {
        this.repo = repo;
        this.countryRepo = countryRepo;
    }

    @GetMapping
    public List<RegionDto> all() {
        return repo.findAll().stream()
                .map(r -> new RegionDto(r.getId(), r.getName(), r.getCode(),
                        r.getCountry() != null ? r.getCountry().getId() : null))
                .toList();
    }

    @GetMapping("/{id}")
    public RegionDto getById(@PathVariable String id) {
        var region = repo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Region not found"));
        return new RegionDto(region.getId(), region.getName(), region.getCode(),
                region.getCountry() != null ? region.getCountry().getId() : null);
    }

    @PostMapping
    public RegionDto create(@RequestBody RegionDto dto) {
        Region r = new Region();
        r.setName(dto.name());
        r.setCode(dto.code());
        if (dto.countryId() != null)
            r.setCountry(countryRepo.findById(dto.countryId()).orElse(null));
        repo.save(r);
        return new RegionDto(r.getId(), r.getName(), r.getCode(),
                r.getCountry() != null ? r.getCountry().getId() : null);
    }

    @PutMapping("/{id}")
    public RegionDto update(@PathVariable String id, @RequestBody RegionDto dto) {
        Region r = repo.findById(id).orElseThrow();
        r.setName(dto.name());
        r.setCode(dto.code());
        if (dto.countryId() != null)
            r.setCountry(countryRepo.findById(dto.countryId()).orElse(null));
        repo.save(r);
        return new RegionDto(r.getId(), r.getName(), r.getCode(),
                r.getCountry() != null ? r.getCountry().getId() : null);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable String id) { repo.deleteById(id); }
}
