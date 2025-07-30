package com.industria.platform.dto;

public record UserDto(String id, String email, String name, String role,
                      String company, String phone, Boolean isActive,
                      Integer zoneCount) {}
