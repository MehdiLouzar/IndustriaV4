package com.industria.platform.controller;

import com.industria.platform.dto.RegionDto;
import com.industria.platform.dto.ListResponse;
import com.industria.platform.entity.Country;
import com.industria.platform.entity.Region;
import com.industria.platform.repository.CountryRepository;
import com.industria.platform.repository.RegionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.data.domain.PageRequest;

import java.util.List;

/**
 * Contrôleur REST pour la gestion des régions.
 * 
 * @author Industria Platform Team
 * @version 1.0
 * @since 1.0
 */
@RestController
@RequestMapping("/api/regions")
@RequiredArgsConstructor
@Slf4j
public class RegionController {
    
    private final RegionRepository repo;
    private final CountryRepository countryRepo;

    /**
     * Récupère toutes les régions avec pagination.
     *
     * @param page numéro de la page (défaut: 1)
     * @param limit nombre d'éléments par page (défaut: 10, max: 100)
     * @return réponse paginée des régions
     */
    @GetMapping
    public ListResponse<RegionDto> list(@RequestParam(defaultValue = "1") int page,
                                        @RequestParam(defaultValue = "10") int limit) {
        int p = Math.max(1, page);
        int l = Math.min(Math.max(1, limit), 100);
        var res = repo.findAll(PageRequest.of(p - 1, l));
        var items = res.getContent().stream()
                .map(r -> new RegionDto(r.getId(), r.getName(), r.getCode(),
                        r.getCountry() != null ? r.getCountry().getId() : null))
                .toList();
        return new ListResponse<>(items, res.getTotalElements(), res.getTotalPages(), p, l);
    }

    /**
     * Récupère toutes les régions sans pagination.
     *
     * @return liste complète des régions
     */
    @GetMapping("/all")
    public List<RegionDto> getAll() {
        return repo.findAll().stream()
                .map(r -> new RegionDto(r.getId(), r.getName(), r.getCode(),
                        r.getCountry() != null ? r.getCountry().getId() : null))
                .toList();
    }
    
    /**
     * Récupère les régions d'un pays spécifique.
     *
     * @param countryId identifiant du pays
     * @return liste des régions du pays
     */
    @GetMapping("/by-country/{countryId}")
    public List<RegionDto> getByCountry(@PathVariable String countryId) {
        return repo.findByCountryId(countryId).stream()
                .map(r -> new RegionDto(r.getId(), r.getName(), r.getCode(),
                        r.getCountry() != null ? r.getCountry().getId() : null))
                .toList();
    }

    /**
     * Récupère une région par son identifiant.
     *
     * @param id identifiant de la région
     * @return données de la région
     * @throws ResponseStatusException si la région n'est pas trouvée
     */
    @GetMapping("/{id}")
    public RegionDto getById(@PathVariable String id) {
        var region = repo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Region not found"));
        return new RegionDto(region.getId(), region.getName(), region.getCode(),
                region.getCountry() != null ? region.getCountry().getId() : null);
    }

    /**
     * Crée une nouvelle région.
     *
     * @param dto données de la région à créer
     * @return la région créée
     */
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

    /**
     * Met à jour une région existante.
     *
     * @param id identifiant de la région
     * @param dto nouvelles données de la région
     * @return la région mise à jour
     */
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

    /**
     * Supprime une région par son identifiant.
     *
     * @param id identifiant de la région à supprimer
     */
    @DeleteMapping("/{id}")
    public void delete(@PathVariable String id) { 
        repo.deleteById(id); 
    }
}
