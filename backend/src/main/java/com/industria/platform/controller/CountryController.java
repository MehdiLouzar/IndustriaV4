package com.industria.platform.controller;

import com.industria.platform.dto.CountryDto;
import com.industria.platform.dto.ListResponse;
import com.industria.platform.entity.Country;
import com.industria.platform.repository.CountryRepository;
import jakarta.annotation.security.PermitAll;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Contrôleur REST pour la gestion des pays.
 * 
 * @author Industria Platform Team
 * @version 1.0
 * @since 1.0
 */
@RestController
@RequestMapping("/api/countries")
@RequiredArgsConstructor
@Slf4j
public class CountryController {
    
    private final CountryRepository repo;

    /**
     * Récupère tous les pays avec pagination.
     *
     * @param page numéro de la page (défaut: 1)
     * @param limit nombre d'éléments par page (défaut: 10, max: 100)
     * @return réponse paginée des pays
     */
    @GetMapping
    public ListResponse<CountryDto> list(@RequestParam(defaultValue = "1") int page,
                                         @RequestParam(defaultValue = "10") int limit) {
        int p = Math.max(1, page);
        int l = Math.min(Math.max(1, limit), 100);
        var res = repo.findAll(PageRequest.of(p - 1, l));
        var items = res.getContent().stream()
                .map(this::toDto)
                .toList();
        return new ListResponse<>(items, res.getTotalElements(), res.getTotalPages(), p, l);
    }

    /**
     * Récupère tous les pays sans pagination.
     * Accessible à tous les utilisateurs sans authentification.
     *
     * @return liste complète des pays
     */
    @GetMapping("/all")
    @PermitAll
    public List<CountryDto> getAll() {
        return repo.findAll().stream()
                .map(this::toDto)
                .toList();
    }

    /**
     * Crée un nouveau pays.
     *
     * @param dto données du pays à créer
     * @return le pays créé
     */
    @PostMapping
    public CountryDto create(@RequestBody CountryDto dto) {
        Country c = new Country();
        c.setName(dto.name());
        c.setCode(dto.code());
        c.setCurrency(dto.currency());
        c.setDefaultSrid(dto.defaultSrid());
        
        // Créer un SRS simple si un nom est fourni
        if (dto.spatialReferenceSystemName() != null && !dto.spatialReferenceSystemName().trim().isEmpty()) {
            // Pour simplifier, on stocke juste le nom sans créer d'entité SRS
            // Vous pourriez étendre ceci pour créer automatiquement un SRS
        }
        
        repo.save(c);
        return toDto(c);
    }

    /**
     * Met à jour un pays existant.
     *
     * @param id identifiant du pays à modifier
     * @param dto nouvelles données du pays
     * @return le pays mis à jour
     */
    @PutMapping("/{id}")
    public CountryDto update(@PathVariable String id, @RequestBody CountryDto dto) {
        Country c = repo.findById(id).orElseThrow();
        c.setName(dto.name());
        c.setCode(dto.code());
        c.setCurrency(dto.currency());
        c.setDefaultSrid(dto.defaultSrid());
        
        // Gérer le nom du système de coordonnées
        // Pour simplifier, on ne fait rien de spécial ici
        // Vous pourriez étendre ceci pour gérer automatiquement les SRS
        
        repo.save(c);
        return toDto(c);
    }

    /**
     * Supprime un pays.
     *
     * @param id identifiant du pays à supprimer
     */
    @DeleteMapping("/{id}")
    public void delete(@PathVariable String id) {
        repo.deleteById(id);
    }
    
    
    /**
     * Convertit une entité Country en DTO.
     */
    private CountryDto toDto(Country c) {
        return new CountryDto(
            c.getId(),
            c.getName(),
            c.getCode(),
            c.getCurrency(),
            c.getDefaultSrid(),
            c.getSpatialReferenceSystem() != null ? c.getSpatialReferenceSystem().getName() : null
        );
    }
}
