package com.industria.platform.controller;

import com.industria.platform.dto.ActivityDto;
import com.industria.platform.dto.ListResponse;
import com.industria.platform.entity.Activity;
import com.industria.platform.repository.ActivityRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Contrôleur REST pour la gestion des activités.
 * 
 * @author Industria Platform Team
 * @version 1.0
 * @since 1.0
 */
@RestController
@RequestMapping("/api/activities")
@RequiredArgsConstructor
@Slf4j
public class ActivityController {
    
    private final ActivityRepository repo;

    /**
     * Récupère toutes les activités avec pagination.
     *
     * @param page numéro de la page (défaut: 1)
     * @param limit nombre d'éléments par page (défaut: 10, max: 100)
     * @return réponse paginée des activités
     */
    @GetMapping
    public ListResponse<ActivityDto> all(@RequestParam(defaultValue = "1") int page,
                                         @RequestParam(defaultValue = "10") int limit) {
        int p = Math.max(1, page);
        int l = Math.min(Math.max(1, limit), 100);
        var res = repo.findAll(PageRequest.of(p - 1, l));
        var items = res.getContent().stream()
                .map(a -> new ActivityDto(a.getId(), a.getName(), a.getDescription(), a.getIcon(), a.getCategory()))
                .toList();
        return new ListResponse<>(items, res.getTotalElements(), res.getTotalPages(), p, l);
    }

    /**
     * Récupère toutes les activités sans pagination.
     *
     * @return liste complète des activités
     */
    @GetMapping("/all")
    public List<ActivityDto> allActivities() {
        return repo.findAll()
                .stream()
                .map(a -> new ActivityDto(a.getId(), a.getName(), a.getDescription(), a.getIcon(), a.getCategory()))
                .toList();
    }

    /**
     * Récupère une activité par son identifiant.
     *
     * @param id identifiant de l'activité
     * @return l'activité correspondante
     */
    @GetMapping("/{id}")
    public ActivityDto get(@PathVariable String id) {
        Activity a = repo.findById(id).orElseThrow();
        return new ActivityDto(a.getId(), a.getName(), a.getDescription(), a.getIcon(), a.getCategory());
    }

    /**
     * Crée une nouvelle activité.
     *
     * @param dto données de l'activité à créer
     * @return l'activité créée
     */
    @PostMapping
    public ActivityDto create(@RequestBody ActivityDto dto) {
        Activity a = new Activity();
        updateEntity(a, dto);
        repo.save(a);
        return new ActivityDto(a.getId(), a.getName(), a.getDescription(), a.getIcon(), a.getCategory());
    }

    /**
     * Met à jour une activité existante.
     *
     * @param id identifiant de l'activité à modifier
     * @param dto nouvelles données de l'activité
     * @return l'activité mise à jour
     */
    @PutMapping("/{id}")
    public ActivityDto update(@PathVariable String id, @RequestBody ActivityDto dto) {
        Activity a = repo.findById(id).orElseThrow();
        updateEntity(a, dto);
        repo.save(a);
        return new ActivityDto(a.getId(), a.getName(), a.getDescription(), a.getIcon(), a.getCategory());
    }

    /**
     * Supprime une activité.
     *
     * @param id identifiant de l'activité à supprimer
     */
    @DeleteMapping("/{id}")
    public void delete(@PathVariable String id) {
        repo.deleteById(id);
    }

    private void updateEntity(Activity a, ActivityDto dto) {
        a.setName(dto.name());
        a.setDescription(dto.description());
        a.setIcon(dto.icon());
        a.setCategory(dto.category());
    }
}
