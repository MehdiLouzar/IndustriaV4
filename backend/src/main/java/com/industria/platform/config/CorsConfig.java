package com.industria.platform.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

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
    public WebMvcConfigurer corsConfigurer() {
        return new WebMvcConfigurer() {
            @Override
            public void addCorsMappings(CorsRegistry registry) {
                registry.addMapping("/**")
                        .allowedOrigins("http://localhost:3000")
                        .allowedMethods("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS")
                        .allowedHeaders("*");
            }
        };
    }
}
