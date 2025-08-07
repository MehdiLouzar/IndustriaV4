package com.industria.platform.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.oauth2.server.resource.authentication.JwtGrantedAuthoritiesConverter;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.security.config.http.SessionCreationPolicy;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain api(HttpSecurity http) throws Exception {
        http
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .csrf(csrf -> csrf.disable())
            .authorizeHttpRequests(auth -> auth
                // Pages publiques et APIs GET publiques
                .requestMatchers(HttpMethod.GET, "/", "/api/zones/**", "/api/parcels/**", "/api/reservations/**", "/api/regions/**", "/api/zone-types/**", "/api/activities/**", "/api/amenities/**", "/api/countries/**", "/api/map/**").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/reservations").permitAll()
                .requestMatchers("/api/public/**", "/api/auth/**").permitAll()
                // Pages admin protégées (admin et zone_manager seulement)
                .requestMatchers("/api/admin/**").hasAnyRole("ADMIN", "ZONE_MANAGER")
                // CRUD zones et parcels (admin et zone_manager avec restrictions)
                .requestMatchers(HttpMethod.POST, "/api/zones/**", "/api/parcels/**").hasAnyRole("ADMIN", "ZONE_MANAGER")
                .requestMatchers(HttpMethod.PUT, "/api/zones/**", "/api/parcels/**").hasAnyRole("ADMIN", "ZONE_MANAGER")
                .requestMatchers(HttpMethod.DELETE, "/api/zones/**", "/api/parcels/**").hasAnyRole("ADMIN", "ZONE_MANAGER")
                // CRUD référentiels (admin uniquement)
                .requestMatchers(HttpMethod.POST, "/api/regions/**", "/api/zone-types/**", "/api/activities/**", "/api/amenities/**", "/api/countries/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.PUT, "/api/regions/**", "/api/zone-types/**", "/api/activities/**", "/api/amenities/**", "/api/countries/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.DELETE, "/api/regions/**", "/api/zone-types/**", "/api/activities/**", "/api/amenities/**", "/api/countries/**").hasRole("ADMIN")
                // Appointments (admin et zone_manager avec restrictions)
                .requestMatchers("/api/appointments/**").hasAnyRole("ADMIN", "ZONE_MANAGER")
                // Toute autre requête nécessite l'authentification
                .anyRequest().authenticated()
            )
            .oauth2ResourceServer(oauth2 -> oauth2
                .jwt(jwt -> jwt
                    .decoder(jwtDecoder())
                    .jwtAuthenticationConverter(jwtAuthenticationConverter())
                )
            )
            .sessionManagement(sess ->
                sess.sessionCreationPolicy(SessionCreationPolicy.STATELESS)
            );
        return http.build();
    }

    @Bean
    public JwtDecoder jwtDecoder() {
        // Utiliser seulement l'URL JWK pour valider la signature, sans validation de l'issuer
        return NimbusJwtDecoder
            .withJwkSetUri("http://keycloak:8080/realms/industria/protocol/openid-connect/certs")
            .build();
    }

    @Bean
    public JwtAuthenticationConverter jwtAuthenticationConverter() {
        JwtAuthenticationConverter jwtConverter = new JwtAuthenticationConverter();
        
        // Extraction manuelle des rôles depuis realm_access.roles
        jwtConverter.setJwtGrantedAuthoritiesConverter(jwt -> {
            System.out.println("🔍 JWT Claims disponibles: " + jwt.getClaims().keySet());
            
            var realmAccess = jwt.getClaimAsMap("realm_access");
            if (realmAccess != null) {
                System.out.println("🔍 realm_access contenu: " + realmAccess);
                if (realmAccess.containsKey("roles")) {
                    var roles = (java.util.List<String>) realmAccess.get("roles");
                    System.out.println("🔍 Rôles extraits: " + roles);
                    
                    var authorities = roles.stream()
                        .map(role -> {
                            String authority = "ROLE_" + role; // Pas de toUpperCase() car déjà en majuscules
                            System.out.println("🔍 Autorité créée: " + authority);
                            return (org.springframework.security.core.GrantedAuthority) new org.springframework.security.core.authority.SimpleGrantedAuthority(authority);
                        })
                        .collect(java.util.stream.Collectors.toList());
                        
                    System.out.println("🔍 Autorités finales: " + authorities);
                    return authorities;
                }
            }
            
            System.out.println("⚠️ Aucun rôle trouvé dans le token JWT");
            return java.util.Collections.emptyList();
        });
        
        return jwtConverter;
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowCredentials(true);
        config.addAllowedOrigin("http://localhost:3000");
        config.addAllowedMethod("*");
        config.addAllowedHeader("*");

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}
