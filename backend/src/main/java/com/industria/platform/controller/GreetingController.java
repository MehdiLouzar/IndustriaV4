/**
 * Contrôleur de salutation publique
 * 
 * Fournit un endpoint simple de test pour la vérification 
 * du fonctionnement de l'API et de l'internationalisation.
 * 
 * @author Industria Platform Team
 * @version 1.0
 * @since 1.0
 */
package com.industria.platform.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.context.MessageSource;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.beans.factory.annotation.Autowired;

import java.util.Map;
import java.util.Locale;

@RestController
@RequestMapping("/api/public")
public class GreetingController {

    @Autowired
    private MessageSource messageSource;

    /**
     * Endpoint de salutation avec support de l'internationalisation
     * 
     * @return Message de bienvenue localisé
     */
    @GetMapping("/greeting")
    public Map<String, String> greeting() {
        Locale currentLocale = LocaleContextHolder.getLocale();
        String message = messageSource.getMessage("greeting.welcome", null, 
            "Bienvenue sur la plateforme", currentLocale);
        
        return Map.of("message", message);
    }
}