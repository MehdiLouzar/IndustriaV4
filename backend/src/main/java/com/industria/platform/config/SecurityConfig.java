package com.industria.platform.config;

import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Configuration de sécurité Spring Security.
 * 
 * Configure l'authentification OAuth2/JWT via Keycloak, les autorisations
 * par endpoints et rôles, ainsi que la configuration CORS.
 * 
 * @author Industria Platform Team
 * @version 1.0
 * @since 1.0
 */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@Slf4j
@AllArgsConstructor
public class SecurityConfig {

    private final CorsConfigurationSource corsConfigurationSource;


    /**
     * Configure la chaîne de filtres de sécurité.
     * 
     * Définit les règles d'autorisation par endpoint et méthode HTTP,
     * configure l'authentification JWT et désactive les sessions.
     * 
     * @param http configuration HTTP de sécurité
     * @return chaîne de filtres configurée
     * @throws Exception en cas d'erreur de configuration
     */
    @Bean
    public SecurityFilterChain api(HttpSecurity http) throws Exception {
        http
            .cors(cors -> cors.configurationSource(corsConfigurationSource))
            .csrf(AbstractHttpConfigurer::disable)
            .authorizeHttpRequests(auth -> auth
                // Endpoints publics sans authentification
                .requestMatchers(HttpMethod.GET, "/", "/api/zones/**", "/api/parcels/**", "/api/reservations/**",
                               "/api/regions/**", "/api/zone-types/**", "/api/activities/**", "/api/amenities/**",
                               "/api/countries/**", "/api/map/**").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/reservations").permitAll()
                .requestMatchers("/api/public/**", "/api/auth/**").permitAll()

                // Interface administration (ADMIN et ZONE_MANAGER)
                .requestMatchers("/api/admin/**").hasAnyRole("ADMIN", "ZONE_MANAGER")

                // CRUD zones et parcelles (ADMIN et ZONE_MANAGER avec restrictions métier)
                .requestMatchers(HttpMethod.POST, "/api/zones/**", "/api/parcels/**").hasAnyRole("ADMIN", "ZONE_MANAGER")
                .requestMatchers(HttpMethod.PUT, "/api/zones/**", "/api/parcels/**").hasAnyRole("ADMIN", "ZONE_MANAGER")
                .requestMatchers(HttpMethod.DELETE, "/api/zones/**", "/api/parcels/**").hasAnyRole("ADMIN", "ZONE_MANAGER")

                // CRUD données de référence (ADMIN uniquement)
                .requestMatchers(HttpMethod.POST, "/api/regions/**", "/api/zone-types/**", "/api/activities/**",
                               "/api/amenities/**", "/api/countries/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.PUT, "/api/regions/**", "/api/zone-types/**", "/api/activities/**",
                               "/api/amenities/**", "/api/countries/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.DELETE, "/api/regions/**", "/api/zone-types/**", "/api/activities/**",
                               "/api/amenities/**", "/api/countries/**").hasRole("ADMIN")

                // Gestion des rendez-vous (ADMIN et ZONE_MANAGER avec restrictions métier)
                .requestMatchers("/api/appointments/**").hasAnyRole("ADMIN", "ZONE_MANAGER")

                // Toute autre requête nécessite une authentification
                .anyRequest().authenticated()
            )
            .oauth2ResourceServer(oauth2 -> oauth2
                .jwt(jwt -> jwt
                                        .jwtAuthenticationConverter(jwtAuthenticationConverter())
                )
            )
            .sessionManagement(sess ->
                sess.sessionCreationPolicy(SessionCreationPolicy.STATELESS)
            );
        return http.build();
    }



    /**
     * Configure le convertisseur d'authentification JWT.
     * 
     * Extrait les rôles depuis le claim 'realm_access.roles' du token Keycloak
     * et les convertit en autorités Spring Security (ROLE_*).
     * 
     * @return convertisseur JWT configuré
     */
    @Bean
    public JwtAuthenticationConverter jwtAuthenticationConverter() {
        JwtAuthenticationConverter jwtConverter = new JwtAuthenticationConverter();
        
        jwtConverter.setJwtGrantedAuthoritiesConverter(jwt -> {
            log.debug("Extraction des rôles depuis JWT: {}", jwt.getClaims().keySet());
            
            var realmAccess = jwt.getClaimAsMap("realm_access");
            if (realmAccess != null && realmAccess.containsKey("roles")) {
                @SuppressWarnings("unchecked")
                List<String> roles = (List<String>) realmAccess.get("roles");
                log.debug("Rôles extraits du token: {}", roles);
                
                var authorities = roles.stream()
                    .map(role -> {
                        String authority = "ROLE_" + role;
                        log.debug("Autorité créée: {}", authority);
                        return (GrantedAuthority) new SimpleGrantedAuthority(authority);
                    })
                    .collect(Collectors.toList());
                    
                log.debug("Autorités finales: {}", authorities);
                return authorities;
            }
            
            log.warn("Aucun rôle trouvé dans le token JWT");
            return Collections.emptyList();
        });
        
        return jwtConverter;
    }

    /**
     * Configure les règles CORS pour permettre les requêtes depuis le frontend.
     * 
     * Autorise les requêtes depuis localhost:3000 (développement) avec
     * toutes les méthodes HTTP et headers.
     * 
     * @return source de configuration CORS
     */

}
