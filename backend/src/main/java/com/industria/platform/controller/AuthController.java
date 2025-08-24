package com.industria.platform.controller;

import com.industria.platform.dto.LoginRequest;
import com.industria.platform.dto.LoginResponse;
import com.industria.platform.dto.RefreshTokenRequest;
import com.industria.platform.dto.UserDto;
import com.industria.platform.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

/**
 * Contrôleur d'authentification (proxy Keycloak côté backend).
 */
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Slf4j
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
        log.info("Tentative de connexion pour: {}", request.email()); // OK if you want this audit line
        return ResponseEntity.ok(authService.login(request));
    }

    @PostMapping("/refresh")
    public ResponseEntity<LoginResponse> refresh(@Valid @RequestBody RefreshTokenRequest request) {
        return ResponseEntity.ok(authService.refreshToken(request));
    }

    /**
     * IMPORTANT: on envoie le REFRESH TOKEN dans le body pour la déconnexion côté IdP.
     * Ne pas utiliser l'Access Token ici.
     */
    @PostMapping("/logout")
    public ResponseEntity<Void> logout(@Valid @RequestBody RefreshTokenRequest request) {
        authService.logout(request.refreshToken());
        return ResponseEntity.noContent().build();
    }

    /**
     * Renvoie l'utilisateur courant en utilisant le JWT déjà VALIDÉ par Spring Security.
     * Pas besoin de lire l’Authorization header manuellement.
     */
    @GetMapping("/me")
    public ResponseEntity<UserDto> getCurrentUser(@AuthenticationPrincipal Jwt jwt) {
        return ResponseEntity.ok(authService.currentUserInfo(jwt));
    }
}
