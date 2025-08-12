package com.industria.platform.controller;

import com.industria.platform.dto.ZoneTypeDto;
import com.industria.platform.dto.ListResponse;
import com.industria.platform.entity.ZoneType;
import com.industria.platform.repository.ZoneTypeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.data.domain.PageRequest;

import java.util.List;

/**
 * Contrôleur REST pour la gestion des types de zones.
 * 
 * @author Industria Platform Team
 * @version 1.0
 * @since 1.0
 */
@RestController
@RequestMapping("/api/zone-types")
@RequiredArgsConstructor
@Slf4j
public class ZoneTypeController {
    
    private final ZoneTypeRepository repo;

    /**
     * Récupère tous les types de zones avec pagination.
     *
     * @param page numéro de la page (défaut: 1)
     * @param limit nombre d'éléments par page (défaut: 10, max: 100)
     * @return réponse paginée des types de zones
     */
    @GetMapping
    public ListResponse<ZoneTypeDto> list(@RequestParam(defaultValue = "1") int page,
                                          @RequestParam(defaultValue = "10") int limit) {
        int p = Math.max(1, page);
        int l = Math.min(Math.max(1, limit), 100);
        var res = repo.findAll(PageRequest.of(p - 1, l));
        var items = res.getContent().stream()
                .map(t -> new ZoneTypeDto(t.getId(), t.getName()))
                .toList();
        return new ListResponse<>(items, res.getTotalElements(), res.getTotalPages(), p, l);
    }

    /**
     * Récupère tous les types de zones sans pagination.
     *
     * @return liste complète des types de zones
     */
    @GetMapping("/all")
    public List<ZoneTypeDto> getAll() {
        return repo.findAll().stream()
                .map(t -> new ZoneTypeDto(t.getId(), t.getName()))
                .toList();
    }

    /**
     * Récupère un type de zone par son identifiant.
     *
     * @param id identifiant du type de zone
     * @return données du type de zone
     * @throws ResponseStatusException si le type de zone n'est pas trouvé
     */
    @GetMapping("/{id}")
    public ZoneTypeDto getById(@PathVariable String id) {
        var zt = repo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "ZoneType not found"));
        return new ZoneTypeDto(zt.getId(), zt.getName());
    }

    /**
     * Crée un nouveau type de zone.
     *
     * @param dto données du type de zone à créer
     * @return le type de zone créé
     */
    @PostMapping
    public ZoneTypeDto create(@RequestBody ZoneTypeDto dto) {
        ZoneType t = new ZoneType();
        t.setName(dto.name());
        repo.save(t);
        return new ZoneTypeDto(t.getId(), t.getName());
    }

    /**
     * Met à jour un type de zone existant.
     *
     * @param id identifiant du type de zone
     * @param dto nouvelles données du type de zone
     * @return le type de zone mis à jour
     */
    @PutMapping("/{id}")
    public ZoneTypeDto update(@PathVariable String id, @RequestBody ZoneTypeDto dto) {
        ZoneType t = repo.findById(id).orElseThrow();
        t.setName(dto.name());
        repo.save(t);
        return new ZoneTypeDto(t.getId(), t.getName());
    }

    /**
     * Supprime un type de zone par son identifiant.
     *
     * @param id identifiant du type de zone à supprimer
     */
    @DeleteMapping("/{id}")
    public void delete(@PathVariable String id) { 
        repo.deleteById(id); 
    }
}
