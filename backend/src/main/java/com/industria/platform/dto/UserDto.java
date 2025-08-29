package com.industria.platform.dto;

/**
 * DTO représentant un utilisateur pour les échanges API.
 * 
 * Contient les informations principales d'un utilisateur
 * avec son rôle et compteurs associés.
 * 
 * @author Industria Platform Team
 * @version 1.0
 * @since 1.0
 */
public record UserDto(String id, String email, String name, String role,
                      String company, String phone, Boolean isActive,
                      Integer zoneCount) {}
