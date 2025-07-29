package com.industria.platform.controller;

import com.industria.platform.dto.ActivityDto;
import com.industria.platform.entity.Activity;
import com.industria.platform.repository.ActivityRepository;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/activities")
public class ActivityController {
    private final ActivityRepository repo;
    public ActivityController(ActivityRepository repo) {this.repo = repo;}

    @GetMapping
    public List<ActivityDto> all() {
        return repo.findAll().stream().map(this::toDto).toList();
    }

    @PostMapping
    public ActivityDto create(@RequestBody ActivityDto dto) {
        Activity a = new Activity();
        updateEntity(a, dto);
        repo.save(a);
        return toDto(a);
    }

    @PutMapping("/{id}")
    public ActivityDto update(@PathVariable String id, @RequestBody ActivityDto dto) {
        Activity a = repo.findById(id).orElseThrow();
        updateEntity(a, dto);
        repo.save(a);
        return toDto(a);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable String id) { repo.deleteById(id); }

    private void updateEntity(Activity a, ActivityDto dto) {
        a.setName(dto.name());
        a.setDescription(dto.description());
        a.setIcon(dto.icon());
    }

    private ActivityDto toDto(Activity a) {
        return new ActivityDto(a.getId(), a.getName(), a.getDescription(), a.getIcon());
    }
}
