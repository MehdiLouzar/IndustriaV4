package com.industria.platform.dto;

import java.util.List;

/**
 * DTO générique pour les réponses paginées.
 * 
 * Structure standardisée pour toutes les listes paginées retournées par l'API,
 * incluant les métadonnées de pagination nécessaires côté frontend.
 * 
 * @param <T> type des éléments de la liste
 * @param items liste des éléments de la page courante
 * @param totalItems nombre total d'éléments dans la collection
 * @param totalPages nombre total de pages
 * @param page numéro de la page courante (basé 1)
 * @param limit nombre d'éléments par page
 * 
 * @author Industria Platform Team
 * @version 1.0
 * @since 1.0
 */
public record ListResponse<T>(List<T> items, long totalItems, int totalPages, int page, int limit) {}
