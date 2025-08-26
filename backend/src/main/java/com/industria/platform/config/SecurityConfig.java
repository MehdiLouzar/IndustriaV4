package com.industria.platform.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.annotation.web.configurers.HeadersConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.security.web.header.writers.ReferrerPolicyHeaderWriter;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.security.oauth2.server.resource.web.BearerTokenResolver;
import org.springframework.security.oauth2.server.resource.web.DefaultBearerTokenResolver;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.Cookie;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.stream.Collectors;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@Slf4j
public class SecurityConfig {

    /**
     * IMPORTANT: issuer-uri must be set in application.yml to auto-configure the JwtDecoder:
     *
     * spring.security.oauth2.resourceserver.jwt.issuer-uri=https://<keycloak>/realms/industria
     */

    @Bean
    public SecurityFilterChain api(
            HttpSecurity http,
            JwtAuthenticationConverter jwtAuthenticationConverter,
            AuthenticationEntryPoint problemAuthEntryPoint,
            AccessDeniedHandler problemAccessDeniedHandler,
            CorsConfigurationSource corsConfigurationSource,
            BearerTokenResolver bearerTokenResolver
    ) throws Exception {

        http
                .cors(c -> c.configurationSource(corsConfigurationSource))
                .csrf(AbstractHttpConfigurer::disable) // stateless token API. If you use browser cookies, enable CSRF.
                .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .headers(h -> h
                        .contentTypeOptions(c -> {}) // X-Content-Type-Options: nosniff
                        .frameOptions(HeadersConfigurer.FrameOptionsConfig::deny)
                        .referrerPolicy(r -> r.policy(ReferrerPolicyHeaderWriter.ReferrerPolicy.NO_REFERRER))
                        .httpStrictTransportSecurity(hsts -> hsts
                                .includeSubDomains(true).preload(true).maxAgeInSeconds(31536000)))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        // Public endpoints (be granular; avoid broad /api/auth/** here)
                        .requestMatchers(HttpMethod.POST, "/api/auth/login", "/api/auth/refresh").permitAll()
                        .requestMatchers("/api/public/**").permitAll()
                        .requestMatchers(HttpMethod.GET,
                                "/", "/api/zones/**", "/api/parcels/**", "/api/reservations/**",
                                "/api/regions/**", "/api/zone-types/**", "/api/activities/**",
                                "/api/amenities/**", "/api/countries/**", "/api/map/**").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/reservations").permitAll()

                        // Admin areas
                        .requestMatchers("/api/admin/**").hasAnyRole("ADMIN", "ZONE_MANAGER")

                        // Zones / Parcels
                        .requestMatchers(HttpMethod.POST, "/api/zones/**", "/api/parcels/**").hasAnyRole("ADMIN", "ZONE_MANAGER")
                        .requestMatchers(HttpMethod.PUT, "/api/zones/**", "/api/parcels/**").hasAnyRole("ADMIN", "ZONE_MANAGER")
                        .requestMatchers(HttpMethod.DELETE, "/api/zones/**", "/api/parcels/**").hasAnyRole("ADMIN", "ZONE_MANAGER")

                        // Reference data (ADMIN only)
                        .requestMatchers(HttpMethod.POST, "/api/regions/**", "/api/zone-types/**",
                                "/api/activities/**", "/api/amenities/**", "/api/countries/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/api/regions/**", "/api/zone-types/**",
                                "/api/activities/**", "/api/amenities/**", "/api/countries/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/api/regions/**", "/api/zone-types/**",
                                "/api/activities/**", "/api/amenities/**", "/api/countries/**").hasRole("ADMIN")

                        // Appointments
                        .requestMatchers("/api/appointments/**").hasAnyRole("ADMIN", "ZONE_MANAGER")

                        // Auth endpoints that MUST be protected (don’t let a broad /api/auth/** override this)
                        .requestMatchers("/api/auth/logout", "/api/auth/me").authenticated()

                        // Everything else requires auth
                        .anyRequest().authenticated()
                )
                .oauth2ResourceServer(oauth2 -> oauth2
                        .bearerTokenResolver(bearerTokenResolver)
                        .jwt(jwt -> jwt.jwtAuthenticationConverter(jwtAuthenticationConverter))
                        .authenticationEntryPoint(problemAuthEntryPoint)
                        .accessDeniedHandler(problemAccessDeniedHandler)
                );

        return http.build();
    }

    /**
     * Map roles from BOTH realm_access.roles and resource_access[clientId].roles
     * into ROLE_* authorities understood by Spring Security.
     */
    @Bean
    public JwtAuthenticationConverter jwtAuthenticationConverter(
            @Value("${keycloak.resource:frontend}") String clientId
    ) {
        var converter = new JwtAuthenticationConverter();
        converter.setJwtGrantedAuthoritiesConverter(jwt -> {
            Set<String> roles = new HashSet<>();
            roles.addAll(extractRealmRoles(jwt));
            roles.addAll(extractClientRoles(jwt, clientId));

            List<GrantedAuthority> authorities = roles.stream()
                    .filter(Objects::nonNull)
                    .map(String::trim)
                    .filter(r -> !r.isEmpty())
                    .map(r -> (GrantedAuthority) new SimpleGrantedAuthority("ROLE_" + r))
                    .collect(Collectors.toList());

            if (authorities.isEmpty()) {
                log.debug("No roles found in JWT for subject {}", jwt.getSubject());
            }
            return authorities;
        });
        return converter;
    }

    @SuppressWarnings("unchecked")
    private List<String> extractRealmRoles(Jwt jwt) {
        Map<String, Object> realmAccess = jwt.getClaimAsMap("realm_access");
        if (realmAccess == null) return List.of();
        Object raw = realmAccess.get("roles");
        if (raw instanceof List<?> list) {
            return list.stream().filter(String.class::isInstance).map(String.class::cast).toList();
        }
        return List.of();
    }

    @SuppressWarnings("unchecked")
    private List<String> extractClientRoles(Jwt jwt, String clientId) {
        Map<String, Object> resourceAccess = jwt.getClaimAsMap("resource_access");
        if (resourceAccess == null) return List.of();
        Object clientBlock = resourceAccess.get(clientId);
        if (!(clientBlock instanceof Map<?, ?> cb)) return List.of();
        Object raw = ((Map<String, Object>) cb).get("roles");
        if (raw instanceof List<?> list) {
            return list.stream().filter(String.class::isInstance).map(String.class::cast).toList();
        }
        return List.of();
    }

    /**
     * CORS: configurable origins (comma-separated). Example:
     * app.cors.allowed-origins=http://localhost:3000,https://admin.industria.ma
     */
    @Bean
    public CorsConfigurationSource corsConfigurationSource(
            @Value("${app.cors.allowed-origins:http://localhost:3000}") String originsCsv
    ) {
        List<String> origins = Arrays.stream(originsCsv.split(","))
                .map(String::trim).filter(s -> !s.isEmpty()).toList();

        CorsConfiguration config = new CorsConfiguration();
        config.setAllowCredentials(true);
        config.setAllowedOrigins(origins);
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("Authorization", "Content-Type", "X-Requested-With", "Idempotency-Key"));
        config.setExposedHeaders(List.of("Location", "Link", "X-Total-Count", "X-Request-Id", "WWW-Authenticate"));
        config.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }

    @Bean
    public BearerTokenResolver bearerTokenResolver() {
        DefaultBearerTokenResolver resolver = new DefaultBearerTokenResolver();
        return request -> {
            String token = resolver.resolve(request);
            if (token == null) {
                Cookie[] cookies = request.getCookies();
                if (cookies != null) {
                    for (Cookie cookie : cookies) {
                        if ("accessToken".equals(cookie.getName())) {
                            return cookie.getValue();
                        }
                    }
                }
            }
            return token;
        };
    }

    /** Return RFC 7807-ish JSON for 401 */
    @Bean
    public AuthenticationEntryPoint problemAuthEntryPoint() {
        return (HttpServletRequest req, HttpServletResponse res, AuthenticationException ex) ->
                writeProblem(res, HttpServletResponse.SC_UNAUTHORIZED,
                        "Unauthorized", "Authentication is required for this resource.");
    }

    // 403 handler
    @Bean
    public AccessDeniedHandler problemAccessDeniedHandler() {
        return (HttpServletRequest req, HttpServletResponse res, AccessDeniedException ex) ->
                writeProblem(res, HttpServletResponse.SC_FORBIDDEN,
                        "Forbidden", "You do not have permission to access this resource.");
    }

    private void writeProblem(HttpServletResponse res, int status, String title, String detail) throws IOException {
        res.setStatus(status);
        res.setCharacterEncoding(StandardCharsets.UTF_8.name());
        res.setContentType(MediaType.APPLICATION_PROBLEM_JSON_VALUE);
        String body = """
        {
          "type": "about:blank",
          "title": "%s",
          "status": %d,
          "detail": "%s"
        }
        """.formatted(escapeJson(title), status, escapeJson(detail));
        res.getWriter().write(body);
    }

    private String escapeJson(String s) {
        return s == null ? "" : s.replace("\\", "\\\\").replace("\"", "\\\"");
    }
}
