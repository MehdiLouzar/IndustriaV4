package com.industria.platform.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.util.Arrays;

/**
 * Configuration CORS pour l'API REST.
 * 
 * Configure les autorisations de partage de ressources entre origines
 * pour permettre au frontend React d'accéder à l'API backend.
 * 
 * @author Industria Platform Team
 * @version 1.0
 * @since 1.0
 */
@Configuration
public class CorsConfig {

    /**
     * Configure les règles CORS pour l'application.
     * 
     * Autorise les requêtes depuis localhost:3000 (développement)
     * avec toutes les méthodes HTTP et headers.
     * 
     * @return configurateur CORS
     */
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowCredentials(true);
        config.setAllowedOrigins(Arrays.asList(
                "http://localhost",        // ADD: Nginx
                "http://localhost:80",     // ADD: Nginx with port
                "http://localhost:3000"    // KEEP: Frontend direct
        ));
        config.addAllowedMethod("*");
        config.addAllowedHeader("*");

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}
