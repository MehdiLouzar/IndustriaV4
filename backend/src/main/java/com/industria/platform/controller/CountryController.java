package com.industria.platform.controller;

import com.industria.platform.dto.CountryDto;
import com.industria.platform.dto.ListResponse;
import com.industria.platform.entity.Country;
import com.industria.platform.repository.CountryRepository;
import jakarta.annotation.security.PermitAll;
import org.springframework.web.bind.annotation.*;
import org.springframework.data.domain.PageRequest;

import java.util.List;

@RestController
@RequestMapping("/api/countries")
public class CountryController {
    private final CountryRepository repo;

    public CountryController(CountryRepository repo) {this.repo = repo;}

    @GetMapping
    public ListResponse<CountryDto> list(@RequestParam(defaultValue = "1") int page,
                                         @RequestParam(defaultValue = "10") int limit) {
        int p = Math.max(1, page);
        int l = Math.min(Math.max(1, limit), 100);
        var res = repo.findAll(PageRequest.of(p - 1, l));
        var items = res.getContent().stream()
                .map(c -> new CountryDto(c.getId(), c.getName(), c.getCode()))
                .toList();
        return new ListResponse<>(items, res.getTotalElements(), res.getTotalPages(), p, l);
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
