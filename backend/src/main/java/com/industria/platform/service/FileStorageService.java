package com.industria.platform.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

/**
 * Service de stockage et gestion des fichiers.
 * 
 * Gère le stockage sécurisé des fichiers uploadés (images, documents)
 * avec organisation par répertoires et nommage unique.
 * 
 * @author Industria Platform Team
 * @version 1.0
 * @since 1.0
 */
@Service
@Slf4j
public class FileStorageService {

    @Value("${file.upload.dir:uploads}")
    private String uploadDir;

    /**
     * Stocke un fichier dans le système de fichiers.
     * 
     * Génère automatiquement un nom unique et crée les répertoires
     * nécessaires pour organiser le stockage.
     * 
     * @param file fichier à stocker
     * @param subDir sous-répertoire de stockage
     * @return nom du fichier généré
     * @throws IOException si une erreur de stockage survient
     */
    public String storeFile(MultipartFile file, String subDir) throws IOException {
        // Créer le répertoire s'il n'existe pas
        Path uploadPath = Paths.get(uploadDir, subDir);
        if (!Files.exists(uploadPath)) {
            Files.createDirectories(uploadPath);
        }

        // Générer un nom de fichier unique
        String originalFilename = file.getOriginalFilename();
        String extension = "";
        if (originalFilename != null && originalFilename.contains(".")) {
            extension = originalFilename.substring(originalFilename.lastIndexOf("."));
        }
        String filename = UUID.randomUUID().toString() + extension;

        // Stocker le fichier
        Path filePath = uploadPath.resolve(filename);
        Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

        return filename;
    }

    /**
     * Supprime un fichier du système de fichiers.
     * 
     * @param filename nom du fichier à supprimer
     * @param subDir sous-répertoire contenant le fichier
     * @throws IOException si une erreur de suppression survient
     */
    public void deleteFile(String filename, String subDir) throws IOException {
        Path filePath = Paths.get(uploadDir, subDir, filename);
        if (Files.exists(filePath)) {
            Files.delete(filePath);
        }
    }

    /**
     * Obtient le chemin complet d'un fichier.
     * 
     * @param filename nom du fichier
     * @param subDir sous-répertoire du fichier
     * @return chemin complet vers le fichier
     */
    public Path getFilePath(String filename, String subDir) {
        return Paths.get(uploadDir, subDir, filename);
    }

    /**
     * Vérifie l'existence d'un fichier.
     * 
     * @param filename nom du fichier à vérifier
     * @param subDir sous-répertoire du fichier
     * @return true si le fichier existe
     */
    public boolean fileExists(String filename, String subDir) {
        Path filePath = Paths.get(uploadDir, subDir, filename);
        return Files.exists(filePath);
    }
}