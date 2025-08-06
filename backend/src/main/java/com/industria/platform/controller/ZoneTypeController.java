package com.industria.platform.controller;

import com.industria.platform.dto.ZoneTypeDto;
import com.industria.platform.entity.ZoneType;
import com.industria.platform.repository.ZoneTypeRepository;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/zone-types")
public class ZoneTypeController {
    private final ZoneTypeRepository repo;

    public ZoneTypeController(ZoneTypeRepository repo) {this.repo = repo;}

    @GetMapping
    public List<ZoneTypeDto> all() {
        return repo.findAll().stream()
                .map(t -> new ZoneTypeDto(t.getId(), t.getName()))
                .toList();
    }

    @GetMapping("/all")
    public List<ZoneTypeDto> getAll() {
        return repo.findAll().stream()
                .map(t -> new ZoneTypeDto(t.getId(), t.getName()))
                .toList();
    }

    @GetMapping("/{id}")
    public ZoneTypeDto getById(@PathVariable String id) {
        var zt = repo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "ZoneType not found"));
        return new ZoneTypeDto(zt.getId(), zt.getName());
    }

    @PostMapping
    public ZoneTypeDto create(@RequestBody ZoneTypeDto dto) {
        ZoneType t = new ZoneType();
        t.setName(dto.name());
        repo.save(t);
        return new ZoneTypeDto(t.getId(), t.getName());
    }

    @PutMapping("/{id}")
    public ZoneTypeDto update(@PathVariable String id, @RequestBody ZoneTypeDto dto) {
        ZoneType t = repo.findById(id).orElseThrow();
        t.setName(dto.name());
        repo.save(t);
        return new ZoneTypeDto(t.getId(), t.getName());
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable String id) { repo.deleteById(id); }
}
