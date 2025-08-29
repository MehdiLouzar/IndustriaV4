package com.industria.platform.controller;

import com.industria.platform.dto.AmenityDto;
import com.industria.platform.dto.ListResponse;
import com.industria.platform.entity.Amenity;
import com.industria.platform.repository.AmenityRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Contrôleur REST pour la gestion des équipements.
 * 
 * @author Industria Platform Team
 * @version 1.0
 * @since 1.0
 */
@RestController
@RequestMapping("/api/amenities")
@RequiredArgsConstructor
@Slf4j
public class AmenityController {
    
    private final AmenityRepository repo;

    /**
     * Récupère tous les équipements avec pagination.
     *
     * @param page numéro de la page (défaut: 1)
     * @param limit nombre d'éléments par page (défaut: 10, max: 100)
     * @return réponse paginée des équipements
     */
    @GetMapping
    public ListResponse<AmenityDto> all(@RequestParam(defaultValue = "1") int page,
                                        @RequestParam(defaultValue = "10") int limit) {
        int p = Math.max(1, page);
        int l = Math.min(Math.max(1, limit), 100);
        var res = repo.findAll(PageRequest.of(p - 1, l));
        var items = res.getContent().stream()
                .map(a -> new AmenityDto(a.getId(), a.getName(), a.getDescription(), a.getIcon(), a.getCategory()))
                .toList();
        return new ListResponse<>(items, res.getTotalElements(), res.getTotalPages(), p, l);
    }

    /**
     * Récupère tous les équipements sans pagination.
     *
     * @return liste complète des équipements
     */
    @GetMapping("/all")
    public List<AmenityDto> allAmenities() {
        return repo.findAll()
                .stream()
                .map(a -> new AmenityDto(a.getId(), a.getName(), a.getDescription(), a.getIcon(), a.getCategory()))
                .toList();
    }

    /**
     * Récupère un équipement par son identifiant.
     *
     * @param id identifiant de l'équipement
     * @return l'équipement correspondant
     */
    @GetMapping("/{id}")
    public AmenityDto get(@PathVariable String id) {
        Amenity a = repo.findById(id).orElseThrow();
        return new AmenityDto(a.getId(), a.getName(), a.getDescription(), a.getIcon(), a.getCategory());
    }

    /**
     * Crée un nouvel équipement.
     *
     * @param dto données de l'équipement à créer
     * @return l'équipement créé
     */
    @PostMapping
    public AmenityDto create(@RequestBody AmenityDto dto) {
        Amenity a = new Amenity();
        updateEntity(a, dto);
        repo.save(a);
        return new AmenityDto(a.getId(), a.getName(), a.getDescription(), a.getIcon(), a.getCategory());
    }

    /**
     * Met à jour un équipement existant.
     *
     * @param id identifiant de l'équipement à modifier
     * @param dto nouvelles données de l'équipement
     * @return l'équipement mis à jour
     */
    @PutMapping("/{id}")
    public AmenityDto update(@PathVariable String id, @RequestBody AmenityDto dto) {
        Amenity a = repo.findById(id).orElseThrow();
        updateEntity(a, dto);
        repo.save(a);
        return new AmenityDto(a.getId(), a.getName(), a.getDescription(), a.getIcon(), a.getCategory());
    }

    /**
     * Supprime un équipement.
     *
     * @param id identifiant de l'équipement à supprimer
     */
    @DeleteMapping("/{id}")
    public void delete(@PathVariable String id) {
        repo.deleteById(id);
    }

    private void updateEntity(Amenity a, AmenityDto dto) {
        a.setName(dto.name());
        a.setDescription(dto.description());
        a.setIcon(dto.icon());
        a.setCategory(dto.category());
    }
}
