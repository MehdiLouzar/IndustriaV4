package com.industria.platform.controller;

import com.industria.platform.dto.CountryDto;
import com.industria.platform.entity.Country;
import com.industria.platform.repository.CountryRepository;
import jakarta.annotation.security.PermitAll;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/countries")
public class CountryController {
    private final CountryRepository repo;

    public CountryController(CountryRepository repo) {this.repo = repo;}

    @GetMapping
    public List<CountryDto> all() {
        return repo.findAll().stream()
                .map(c -> new CountryDto(c.getId(), c.getName(), c.getCode()))
                .toList();
    }

    @GetMapping("/all")
    @PermitAll
    public List<CountryDto> getAll() {
        return repo.findAll().stream()
                .map(c -> new CountryDto(c.getId(), c.getName(), c.getCode()))
                .toList();
    }

    @PostMapping
    public CountryDto create(@RequestBody CountryDto dto) {
        Country c = new Country();
        c.setName(dto.name());
        c.setCode(dto.code());
        repo.save(c);
        return new CountryDto(c.getId(), c.getName(), c.getCode());
    }

    @PutMapping("/{id}")
    public CountryDto update(@PathVariable String id, @RequestBody CountryDto dto) {
        Country c = repo.findById(id).orElseThrow();
        c.setName(dto.name());
        c.setCode(dto.code());
        repo.save(c);
        return new CountryDto(c.getId(), c.getName(), c.getCode());
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable String id) { repo.deleteById(id); }
}
