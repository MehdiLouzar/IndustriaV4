package com.industria.platform.controller;

import com.industria.platform.entity.Parcel;
import com.industria.platform.entity.ParcelImage;
import com.industria.platform.repository.ParcelImageRepository;
import com.industria.platform.repository.ParcelRepository;
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
@RequestMapping("/api/parcels/{parcelId}/images")
public class ParcelImageController {

    @Autowired
    private ParcelImageRepository parcelImageRepository;
    
    @Autowired
    private ParcelRepository parcelRepository;
    
    @Autowired
    private FileStorageService fileStorageService;

    @GetMapping
    public ResponseEntity<List<ParcelImage>> getParcelImages(@PathVariable String parcelId) {
        List<ParcelImage> images = parcelImageRepository.findByParcelIdOrderByIsPrimaryDescDisplayOrderAsc(parcelId);
        return ResponseEntity.ok(images);
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ParcelImage> uploadParcelImage(
            @PathVariable String parcelId,
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "description", required = false) String description,
            @RequestParam(value = "isPrimary", defaultValue = "false") Boolean isPrimary,
            @RequestParam(value = "displayOrder", defaultValue = "0") Integer displayOrder) {
        
        try {
            // Vérifier que la parcelle existe
            Optional<Parcel> parcelOpt = parcelRepository.findById(parcelId);
            if (parcelOpt.isEmpty()) {
                return ResponseEntity.notFound().build();
            }
            Parcel parcel = parcelOpt.get();

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
                parcelImageRepository.findByParcelIdAndIsPrimaryTrue(parcelId)
                    .ifPresent(existingPrimary -> {
                        existingPrimary.setIsPrimary(false);
                        parcelImageRepository.save(existingPrimary);
                    });
            }

            // Stocker le fichier
            String filename = fileStorageService.storeFile(file, "parcels");

            // Créer l'entité
            ParcelImage parcelImage = new ParcelImage(filename, file.getOriginalFilename(), 
                                                      contentType, file.getSize(), parcel);
            parcelImage.setDescription(description);
            parcelImage.setIsPrimary(isPrimary);
            parcelImage.setDisplayOrder(displayOrder);

            ParcelImage savedImage = parcelImageRepository.save(parcelImage);
            return ResponseEntity.ok(savedImage);

        } catch (IOException e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/{imageId}/file")
    public ResponseEntity<Resource> getImageFile(@PathVariable String parcelId, @PathVariable String imageId) {
        try {
            Optional<ParcelImage> imageOpt = parcelImageRepository.findById(imageId);
            if (imageOpt.isEmpty() || !imageOpt.get().getParcel().getId().equals(parcelId)) {
                return ResponseEntity.notFound().build();
            }

            ParcelImage image = imageOpt.get();
            Path filePath = fileStorageService.getFilePath(image.getFilename(), "parcels");
            
            if (!fileStorageService.fileExists(image.getFilename(), "parcels")) {
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
    public ResponseEntity<ParcelImage> updateParcelImage(
            @PathVariable String parcelId,
            @PathVariable String imageId,
            @RequestParam(value = "description", required = false) String description,
            @RequestParam(value = "isPrimary", defaultValue = "false") Boolean isPrimary,
            @RequestParam(value = "displayOrder", defaultValue = "0") Integer displayOrder) {
        
        Optional<ParcelImage> imageOpt = parcelImageRepository.findById(imageId);
        if (imageOpt.isEmpty() || !imageOpt.get().getParcel().getId().equals(parcelId)) {
            return ResponseEntity.notFound().build();
        }

        ParcelImage image = imageOpt.get();
        
        // Si c'est marqué comme image principale, retirer le flag des autres
        if (isPrimary && !image.getIsPrimary()) {
            parcelImageRepository.findByParcelIdAndIsPrimaryTrue(parcelId)
                .ifPresent(existingPrimary -> {
                    existingPrimary.setIsPrimary(false);
                    parcelImageRepository.save(existingPrimary);
                });
        }

        image.setDescription(description);
        image.setIsPrimary(isPrimary);
        image.setDisplayOrder(displayOrder);

        ParcelImage savedImage = parcelImageRepository.save(image);
        return ResponseEntity.ok(savedImage);
    }

    @DeleteMapping("/{imageId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteParcelImage(@PathVariable String parcelId, @PathVariable String imageId) {
        try {
            Optional<ParcelImage> imageOpt = parcelImageRepository.findById(imageId);
            if (imageOpt.isEmpty() || !imageOpt.get().getParcel().getId().equals(parcelId)) {
                return ResponseEntity.notFound().build();
            }

            ParcelImage image = imageOpt.get();
            
            // Supprimer le fichier physique
            fileStorageService.deleteFile(image.getFilename(), "parcels");
            
            // Supprimer l'enregistrement
            parcelImageRepository.delete(image);
            
            return ResponseEntity.noContent().build();

        } catch (IOException e) {
            return ResponseEntity.internalServerError().build();
        }
    }
}