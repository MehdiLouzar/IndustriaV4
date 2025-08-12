package com.industria.platform.controller;

import com.industria.platform.dto.UserDto;
import com.industria.platform.entity.User;
import com.industria.platform.entity.UserRole;
import com.industria.platform.repository.UserRepository;
import com.industria.platform.repository.ZoneRepository;
import com.industria.platform.service.PermissionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Contrôleur REST pour la gestion des utilisateurs.
 * 
 * @author Industria Platform Team
 * @version 1.0
 * @since 1.0
 */
@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@Slf4j
public class UserController {
    
    private final UserRepository repo;
    private final ZoneRepository zoneRepo;
    private final PermissionService permissionService;

    /**
     * Récupère tous les utilisateurs.
     * Accessible uniquement aux administrateurs.
     *
     * @return liste de tous les utilisateurs
     */
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public List<UserDto> all() {
        return repo.findAll().stream()
                .map(u -> toDto(u, zoneRepo.countByCreatedById(u.getId())))
                .toList();
    }

    /**
     * Récupère un utilisateur par son identifiant.
     * Accessible uniquement aux administrateurs.
     *
     * @param id identifiant de l'utilisateur
     * @return données de l'utilisateur
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public UserDto get(@PathVariable String id) {
        return repo.findById(id)
                .map(u -> toDto(u, zoneRepo.countByCreatedById(id)))
                .orElse(null);
    }

    /**
     * Crée un nouvel utilisateur.
     * Accessible uniquement aux administrateurs.
     *
     * @param dto données de l'utilisateur à créer
     * @return l'utilisateur créé
     */
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public UserDto create(@RequestBody UserDto dto) {
        User u = new User();
        updateEntity(u, dto);
        u.setCreatedAt(LocalDateTime.now());
        repo.save(u);
        return toDto(u, zoneRepo.countByCreatedById(u.getId()));
    }

    /**
     * Met à jour un utilisateur existant.
     * Accessible uniquement aux administrateurs.
     *
     * @param id identifiant de l'utilisateur à modifier
     * @param dto nouvelles données de l'utilisateur
     * @return l'utilisateur mis à jour
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public UserDto update(@PathVariable String id, @RequestBody UserDto dto) {
        User u = repo.findById(id).orElseThrow();
        updateEntity(u, dto);
        u.setUpdatedAt(LocalDateTime.now());
        repo.save(u);
        return toDto(u, zoneRepo.countByCreatedById(u.getId()));
    }

    /**
     * Supprime un utilisateur.
     * Accessible uniquement aux administrateurs.
     *
     * @param id identifiant de l'utilisateur à supprimer
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public void delete(@PathVariable String id) {
        repo.deleteById(id);
    }

    /**
     * Récupère le nombre de zones créées par un utilisateur.
     *
     * @param id identifiant de l'utilisateur
     * @return nombre de zones créées
     */
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
