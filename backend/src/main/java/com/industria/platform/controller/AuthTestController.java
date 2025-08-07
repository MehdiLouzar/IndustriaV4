package com.industria.platform.controller;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/auth")
public class AuthTestController {

    @GetMapping("/test")
    public Map<String, Object> testAuth(Authentication authentication) {
        if (authentication == null) {
            return Map.of(
                "authenticated", false,
                "message", "No authentication found"
            );
        }

        Jwt jwt = (Jwt) authentication.getPrincipal();
        
        return Map.of(
            "authenticated", true,
            "username", authentication.getName(),
            "authorities", authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .collect(Collectors.toList()),
            "jwt_claims", jwt.getClaims(),
            "realm_access", jwt.getClaimAsMap("realm_access")
        );
    }
    
    @GetMapping("/roles")
    public Map<String, Object> getRoles(Authentication authentication) {
        if (authentication == null) {
            return Map.of("error", "Not authenticated");
        }
        
        return Map.of(
            "authorities", authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .collect(Collectors.toList()),
            "hasAdminRole", authentication.getAuthorities().stream()
                .anyMatch(auth -> auth.getAuthority().equals("ROLE_ADMIN")),
            "hasManagerRole", authentication.getAuthorities().stream()
                .anyMatch(auth -> auth.getAuthority().equals("ROLE_MANAGER"))
        );
    }
}