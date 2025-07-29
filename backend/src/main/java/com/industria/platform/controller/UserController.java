package com.industria.platform.controller;

import com.industria.platform.dto.UserDto;
import com.industria.platform.entity.User;
import com.industria.platform.entity.UserRole;
import com.industria.platform.repository.UserRepository;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/users")
public class UserController {
    private final UserRepository repo;

    public UserController(UserRepository repo) {this.repo = repo;}

    @GetMapping
    public List<UserDto> all() {
        return repo.findAll().stream().map(this::toDto).toList();
    }

    @GetMapping("/{id}")
    public UserDto get(@PathVariable String id) {
        return repo.findById(id).map(this::toDto).orElse(null);
    }

    @PostMapping
    public UserDto create(@RequestBody UserDto dto) {
        User u = new User();
        updateEntity(u, dto);
        u.setCreatedAt(LocalDateTime.now());
        repo.save(u);
        return toDto(u);
    }

    @PutMapping("/{id}")
    public UserDto update(@PathVariable String id, @RequestBody UserDto dto) {
        User u = repo.findById(id).orElseThrow();
        updateEntity(u, dto);
        u.setUpdatedAt(LocalDateTime.now());
        repo.save(u);
        return toDto(u);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable String id) { repo.deleteById(id); }

    private void updateEntity(User u, UserDto dto) {
        u.setEmail(dto.email());
        u.setName(dto.name());
        u.setCompany(dto.company());
        u.setPhone(dto.phone());
        if (dto.role() != null)
            u.setRole(UserRole.valueOf(dto.role()));
    }

    private UserDto toDto(User u) {
        return new UserDto(u.getId(), u.getEmail(), u.getName(),
                u.getRole() == null ? null : u.getRole().name(),
                u.getCompany(), u.getPhone(), u.getDeletedAt() == null);
    }
}
