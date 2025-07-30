package com.industria.platform.controller;

import com.industria.platform.dto.UserDto;
import com.industria.platform.entity.User;
import com.industria.platform.entity.UserRole;
import com.industria.platform.repository.UserRepository;
import com.industria.platform.repository.ZoneRepository;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/users")
public class UserController {
    private final UserRepository repo;
    private final ZoneRepository zoneRepo;

    public UserController(UserRepository repo, ZoneRepository zoneRepo) {
        this.repo = repo;
        this.zoneRepo = zoneRepo;
    }

    @GetMapping
    public List<UserDto> all() {
        return repo.findAll().stream()
                .map(u -> toDto(u, zoneRepo.countByCreatedById(u.getId())))
                .toList();
    }

    @GetMapping("/{id}")
    public UserDto get(@PathVariable String id) {
        return repo.findById(id)
                .map(u -> toDto(u, zoneRepo.countByCreatedById(id)))
                .orElse(null);
    }

    @PostMapping
    public UserDto create(@RequestBody UserDto dto) {
        User u = new User();
        updateEntity(u, dto);
        u.setCreatedAt(LocalDateTime.now());
        repo.save(u);
        return toDto(u, zoneRepo.countByCreatedById(u.getId()));
    }

    @PutMapping("/{id}")
    public UserDto update(@PathVariable String id, @RequestBody UserDto dto) {
        User u = repo.findById(id).orElseThrow();
        updateEntity(u, dto);
        u.setUpdatedAt(LocalDateTime.now());
        repo.save(u);
        return toDto(u, zoneRepo.countByCreatedById(u.getId()));
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable String id) { repo.deleteById(id); }

    @GetMapping("/{id}/zones/count")
    public CountResponse zoneCount(@PathVariable String id) {
        int cnt = zoneRepo.countByCreatedById(id);
        return new CountResponse(cnt);
    }

    private void updateEntity(User u, UserDto dto) {
        u.setEmail(dto.email());
        u.setName(dto.name());
        u.setCompany(dto.company());
        u.setPhone(dto.phone());
        if (dto.role() != null)
            u.setRole(UserRole.valueOf(dto.role()));
    }

    private UserDto toDto(User u, int zoneCount) {
        return new UserDto(u.getId(), u.getEmail(), u.getName(),
                u.getRole() == null ? null : u.getRole().name(),
                u.getCompany(), u.getPhone(), u.getDeletedAt() == null,
                zoneCount);
    }

    public record CountResponse(int count) {}
}
