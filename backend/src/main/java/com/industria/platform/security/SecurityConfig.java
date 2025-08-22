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
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

/**
 * Security configuration for session-based authentication.
 * Works with Redis-backed sessions and Keycloak authentication.
 */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@Slf4j
@AllArgsConstructor
public class SecurityConfig {

    private  final CorsConfigurationSource corsConfigurationSource ;

    /**
     * Security context repository for session-based authentication
     */
    @Bean
    public SecurityContextRepository securityContextRepository() {
        return new HttpSessionSecurityContextRepository();
    }



    /**
     * Main security filter chain configuration
     */
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                // CORS configuration
                .cors(cors -> cors.configurationSource(corsConfigurationSource))

                // Disable CSRF for API endpoints (using session tokens instead)
                .csrf(AbstractHttpConfigurer::disable)

                // Session management - REQUIRED for session-based auth
                .sessionManagement(session -> session
                        .sessionCreationPolicy(SessionCreationPolicy.IF_REQUIRED)
                        .maximumSessions(1)
                        .maxSessionsPreventsLogin(false)
                )

                // Security context configuration
                .securityContext(context -> context
                        .securityContextRepository(securityContextRepository())
                        .requireExplicitSave(false)  // Auto-save security context
                )

                // Authorization rules
                .authorizeHttpRequests(auth -> auth
                        // Public endpoints - no authentication required
                        .requestMatchers(HttpMethod.GET, "/", "/api/zones/**", "/api/parcels/**",
                                "/api/reservations/**", "/api/regions/**", "/api/zone-types/**",
                                "/api/activities/**", "/api/amenities/**", "/api/countries/**",
                                "/api/map/**").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/reservations").permitAll()
                        .requestMatchers("/api/public/**", "/api/auth/**").permitAll()
                        .requestMatchers("/actuator/health").permitAll()

                        // Debug endpoints (remove in production)
                        .requestMatchers("/api/debug/**").permitAll()

                        // Admin interface
                        .requestMatchers("/api/admin/**").hasAnyRole("ADMIN", "ZONE_MANAGER")

                        // Zone and parcel management
                        .requestMatchers(HttpMethod.POST, "/api/zones/**", "/api/parcels/**")
                        .hasAnyRole("ADMIN", "ZONE_MANAGER")
                        .requestMatchers(HttpMethod.PUT, "/api/zones/**", "/api/parcels/**")
                        .hasAnyRole("ADMIN", "ZONE_MANAGER")
                        .requestMatchers(HttpMethod.DELETE, "/api/zones/**", "/api/parcels/**")
                        .hasAnyRole("ADMIN", "ZONE_MANAGER")

                        // Reference data management (ADMIN only)
                        .requestMatchers(HttpMethod.POST, "/api/regions/**", "/api/zone-types/**",
                                "/api/activities/**", "/api/amenities/**", "/api/countries/**")
                        .hasRole("ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/api/regions/**", "/api/zone-types/**",
                                "/api/activities/**", "/api/amenities/**", "/api/countries/**")
                        .hasRole("ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/api/regions/**", "/api/zone-types/**",
                                "/api/activities/**", "/api/amenities/**", "/api/countries/**")
                        .hasRole("ADMIN")

                        // Appointment management
                        .requestMatchers("/api/appointments/**").hasAnyRole("ADMIN", "ZONE_MANAGER")

                        // All other requests require authentication
                        .anyRequest().authenticated()
                );

        return http.build();
    }
}