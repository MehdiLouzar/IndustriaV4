package com.industria.platform.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

@Service
public class FileStorageService {

    @Value("${file.upload.dir:uploads}")
    private String uploadDir;

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

    public void deleteFile(String filename, String subDir) throws IOException {
        Path filePath = Paths.get(uploadDir, subDir, filename);
        if (Files.exists(filePath)) {
            Files.delete(filePath);
        }
    }

    public Path getFilePath(String filename, String subDir) {
        return Paths.get(uploadDir, subDir, filename);
    }

    public boolean fileExists(String filename, String subDir) {
        Path filePath = Paths.get(uploadDir, subDir, filename);
        return Files.exists(filePath);
    }
}