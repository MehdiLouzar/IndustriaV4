package com.industria.platform;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Classe principale de l'application Industria Platform Backend.
 * 
 * Cette application Spring Boot fournit une API REST pour la gestion
 * des zones industrielles, parcelles, utilisateurs et rendez-vous.
 * 
 * @author Industria Platform Team
 * @version 1.0
 * @since 1.0
 */
@SpringBootApplication
public class BackendApplication {

	/**
	 * Point d'entrée principal de l'application.
	 * 
	 * @param args arguments de ligne de commande
	 */
	public static void main(String[] args) {
		SpringApplication.run(BackendApplication.class, args);
	}

}
