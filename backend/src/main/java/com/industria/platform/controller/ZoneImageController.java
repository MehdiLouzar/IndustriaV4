package com.industria.platform.controller;

import com.industria.platform.entity.Zone;
import com.industria.platform.entity.ZoneImage;
import com.industria.platform.repository.ZoneImageRepository;
import com.industria.platform.repository.ZoneRepository;
import com.industria.platform.service.FileStorageService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Path;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/zones/{zoneId}/images")
public class ZoneImageController {

    @Autowired
    private ZoneImageRepository zoneImageRepository;
    
    @Autowired
    private ZoneRepository zoneRepository;
    
    @Autowired
    private FileStorageService fileStorageService;

    @GetMapping
    public ResponseEntity<List<ZoneImage>> getZoneImages(@PathVariable String zoneId) {
        List<ZoneImage> images = zoneImageRepository.findByZoneIdOrderByIsPrimaryDescDisplayOrderAsc(zoneId);
        return ResponseEntity.ok(images);
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ZoneImage> uploadZoneImage(
            @PathVariable String zoneId,
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "description", required = false) String description,
            @RequestParam(value = "isPrimary", defaultValue = "false") Boolean isPrimary,
            @RequestParam(value = "displayOrder", defaultValue = "0") Integer displayOrder) {
        
        try {
            // Vérifier que la zone existe
            Optional<Zone> zoneOpt = zoneRepository.findById(zoneId);
            if (zoneOpt.isEmpty()) {
                return ResponseEntity.notFound().build();
            }
            Zone zone = zoneOpt.get();

            // Valider le fichier
            if (file.isEmpty()) {
                return ResponseEntity.badRequest().build();
            }
            
            String contentType = file.getContentType();
            if (contentType == null || !contentType.startsWith("image/")) {
                return ResponseEntity.badRequest().build();
            }

            // Si c'est marqué comme image principale, retirer le flag des autres
            if (isPrimary) {
                zoneImageRepository.findByZoneIdAndIsPrimaryTrue(zoneId)
                    .ifPresent(existingPrimary -> {
                        existingPrimary.setIsPrimary(false);
                        zoneImageRepository.save(existingPrimary);
                    });
            }

            // Stocker le fichier
            String filename = fileStorageService.storeFile(file, "zones");

            // Créer l'entité
            ZoneImage zoneImage = new ZoneImage(filename, file.getOriginalFilename(), 
                                                contentType, file.getSize(), zone);
            zoneImage.setDescription(description);
            zoneImage.setIsPrimary(isPrimary);
            zoneImage.setDisplayOrder(displayOrder);

            ZoneImage savedImage = zoneImageRepository.save(zoneImage);
            return ResponseEntity.ok(savedImage);

        } catch (IOException e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/{imageId}/file")
    public ResponseEntity<Resource> getImageFile(@PathVariable String zoneId, @PathVariable String imageId) {
        try {
            Optional<ZoneImage> imageOpt = zoneImageRepository.findById(imageId);
            if (imageOpt.isEmpty() || !imageOpt.get().getZone().getId().equals(zoneId)) {
                return ResponseEntity.notFound().build();
            }

            ZoneImage image = imageOpt.get();
            Path filePath = fileStorageService.getFilePath(image.getFilename(), "zones");
            
            if (!fileStorageService.fileExists(image.getFilename(), "zones")) {
                return ResponseEntity.notFound().build();
            }

            Resource resource = new UrlResource(filePath.toUri());
            
            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(image.getContentType()))
                    .header(HttpHeaders.CONTENT_DISPOSITION, 
                           "inline; filename=\"" + image.getOriginalFilename() + "\"")
                    .body(resource);

        } catch (MalformedURLException e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @PutMapping("/{imageId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ZoneImage> updateZoneImage(
            @PathVariable String zoneId,
            @PathVariable String imageId,
            @RequestParam(value = "description", required = false) String description,
            @RequestParam(value = "isPrimary", defaultValue = "false") Boolean isPrimary,
            @RequestParam(value = "displayOrder", defaultValue = "0") Integer displayOrder) {
        
        Optional<ZoneImage> imageOpt = zoneImageRepository.findById(imageId);
        if (imageOpt.isEmpty() || !imageOpt.get().getZone().getId().equals(zoneId)) {
            return ResponseEntity.notFound().build();
        }

        ZoneImage image = imageOpt.get();
        
        // Si c'est marqué comme image principale, retirer le flag des autres
        if (isPrimary && !image.getIsPrimary()) {
            zoneImageRepository.findByZoneIdAndIsPrimaryTrue(zoneId)
                .ifPresent(existingPrimary -> {
                    existingPrimary.setIsPrimary(false);
                    zoneImageRepository.save(existingPrimary);
                });
        }

        image.setDescription(description);
        image.setIsPrimary(isPrimary);
        image.setDisplayOrder(displayOrder);

        ZoneImage savedImage = zoneImageRepository.save(image);
        return ResponseEntity.ok(savedImage);
    }

    @DeleteMapping("/{imageId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteZoneImage(@PathVariable String zoneId, @PathVariable String imageId) {
        try {
            Optional<ZoneImage> imageOpt = zoneImageRepository.findById(imageId);
            if (imageOpt.isEmpty() || !imageOpt.get().getZone().getId().equals(zoneId)) {
                return ResponseEntity.notFound().build();
            }

            ZoneImage image = imageOpt.get();
            
            // Supprimer le fichier physique
            fileStorageService.deleteFile(image.getFilename(), "zones");
            
            // Supprimer l'enregistrement
            zoneImageRepository.delete(image);
            
            return ResponseEntity.noContent().build();

        } catch (IOException e) {
            return ResponseEntity.internalServerError().build();
        }
    }
}