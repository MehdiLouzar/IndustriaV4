package com.industria.platform.controller;

import com.industria.platform.dto.UserDto;
import com.industria.platform.entity.User;
import com.industria.platform.entity.UserRole;
import com.industria.platform.repository.UserRepository;
import com.industria.platform.repository.ZoneRepository;
import com.industria.platform.service.PermissionService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/users")
public class UserController {
    private final UserRepository repo;
    private final ZoneRepository zoneRepo;
    private final PermissionService permissionService;

    public UserController(UserRepository repo, ZoneRepository zoneRepo, PermissionService permissionService) {
        this.repo = repo;
        this.zoneRepo = zoneRepo;
        this.permissionService = permissionService;
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public List<UserDto> all() {
        // Seuls les ADMIN peuvent voir tous les utilisateurs
        return repo.findAll().stream()
                .map(u -> toDto(u, zoneRepo.countByCreatedById(u.getId())))
                .toList();
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public UserDto get(@PathVariable String id) {
        // Seuls les ADMIN peuvent voir les détails des utilisateurs
        return repo.findById(id)
                .map(u -> toDto(u, zoneRepo.countByCreatedById(id)))
                .orElse(null);
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public UserDto create(@RequestBody UserDto dto) {
        // Seuls les ADMIN peuvent créer des utilisateurs
        User u = new User();
        updateEntity(u, dto);
        u.setCreatedAt(LocalDateTime.now());
        repo.save(u);
        return toDto(u, zoneRepo.countByCreatedById(u.getId()));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public UserDto update(@PathVariable String id, @RequestBody UserDto dto) {
        // Seuls les ADMIN peuvent modifier les utilisateurs
        User u = repo.findById(id).orElseThrow();
        updateEntity(u, dto);
        u.setUpdatedAt(LocalDateTime.now());
        repo.save(u);
        return toDto(u, zoneRepo.countByCreatedById(u.getId()));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public void delete(@PathVariable String id) { 
        // Seuls les ADMIN peuvent supprimer des utilisateurs
        repo.deleteById(id); 
    }

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
