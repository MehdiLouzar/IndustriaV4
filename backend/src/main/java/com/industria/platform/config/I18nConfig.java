package com.industria.platform.config;

import org.springframework.context.MessageSource;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.support.ReloadableResourceBundleMessageSource;
import org.springframework.web.servlet.LocaleResolver;
import org.springframework.web.servlet.i18n.AcceptHeaderLocaleResolver;

import java.util.Locale;

/**
 * Configuration d'internationalisation (i18n).
 * 
 * Configure la gestion des langues et des messages localisés
 * pour supporter le français par défaut avec fallback.
 * 
 * @author Industria Platform Team
 * @version 1.0
 * @since 1.0
 */
@Configuration
public class I18nConfig {

    /**
     * Configure la source des messages localisés.
     * 
     * Utilise des fichiers de ressources messages.properties
     * avec encodage UTF-8 et rechargement dynamique.
     * 
     * @return source des messages configurée
     */
    @Bean
    public MessageSource messageSource() {
        ReloadableResourceBundleMessageSource messageSource = new ReloadableResourceBundleMessageSource();
        messageSource.setBasename("classpath:messages");
        messageSource.setDefaultEncoding("UTF-8");
        messageSource.setFallbackToSystemLocale(false);
        return messageSource;
    }

    /**
     * Configure le résolveur de locale.
     * 
     * Détermine la langue à utiliser basée sur l'en-tête Accept-Language
     * avec le français comme langue par défaut.
     * 
     * @return résolveur de locale configuré
     */
    @Bean
    public LocaleResolver localeResolver() {
        AcceptHeaderLocaleResolver resolver = new AcceptHeaderLocaleResolver();
        resolver.setDefaultLocale(Locale.FRENCH);
        return resolver;
    }
}
