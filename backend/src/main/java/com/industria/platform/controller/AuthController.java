package com.industria.platform.controller;

import com.industria.platform.dto.LoginRequest;
import com.industria.platform.dto.LoginResponse;
import com.industria.platform.dto.UserDto;
import com.industria.platform.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletResponse;

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
    public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest request, HttpServletResponse response) {
        log.info("Tentative de connexion pour: {}", request.email());
        LoginResponse lr = authService.login(request);
        addAuthCookies(response, lr);
        return ResponseEntity.ok(lr);
    }

    @PostMapping("/refresh")
    public ResponseEntity<LoginResponse> refresh(@CookieValue("refreshToken") String refreshToken, HttpServletResponse response) {
        LoginResponse lr = authService.refreshToken(refreshToken);
        addAuthCookies(response, lr);
        return ResponseEntity.ok(lr);
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(@CookieValue("refreshToken") String refreshToken, HttpServletResponse response) {
        authService.logout(refreshToken);
        clearAuthCookies(response);
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
    private void addAuthCookies(HttpServletResponse response, LoginResponse lr) {
        boolean secure = !"development".equalsIgnoreCase(System.getenv("NODE_ENV"));
        ResponseCookie accessCookie = ResponseCookie.from("accessToken", lr.accessToken())
                .httpOnly(true)
                .secure(secure)
                .path("/")
                .maxAge(lr.expiresIn())
                .sameSite("Lax")
                .build();
        ResponseCookie refreshCookie = ResponseCookie.from("refreshToken", lr.refreshToken())
                .httpOnly(true)
                .secure(secure)
                .path("/")
                .sameSite("Lax")
                .build();
        response.addHeader(HttpHeaders.SET_COOKIE, accessCookie.toString());
        response.addHeader(HttpHeaders.SET_COOKIE, refreshCookie.toString());
    }

    private void clearAuthCookies(HttpServletResponse response) {
        boolean secure = !"development".equalsIgnoreCase(System.getenv("NODE_ENV"));
        ResponseCookie accessCookie = ResponseCookie.from("accessToken", "")
                .httpOnly(true)
                .secure(secure)
                .path("/")
                .maxAge(0)
                .sameSite("Lax")
                .build();
        ResponseCookie refreshCookie = ResponseCookie.from("refreshToken", "")
                .httpOnly(true)
                .secure(secure)
                .path("/")
                .maxAge(0)
                .sameSite("Lax")
                .build();
        response.addHeader(HttpHeaders.SET_COOKIE, accessCookie.toString());
        response.addHeader(HttpHeaders.SET_COOKIE, refreshCookie.toString());
    }
}
