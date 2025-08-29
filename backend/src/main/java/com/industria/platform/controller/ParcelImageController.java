package com.industria.platform.controller;

import com.industria.platform.entity.Parcel;
import com.industria.platform.entity.ParcelImage;
import com.industria.platform.repository.ParcelImageRepository;
import com.industria.platform.repository.ParcelRepository;
import com.industria.platform.service.FileStorageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
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

/**
 * Contrôleur REST pour la gestion des images de parcelles.
 * 
 * @author Industria Platform Team
 * @version 1.0
 * @since 1.0
 */
@RestController
@RequestMapping("/api/parcels/{parcelId}/images")
@RequiredArgsConstructor
@Slf4j
public class ParcelImageController {

    private final ParcelImageRepository parcelImageRepository;
    private final ParcelRepository parcelRepository;
    private final FileStorageService fileStorageService;

    /**
     * Récupère toutes les images d'une parcelle.
     *
     * @param parcelId identifiant de la parcelle
     * @return liste des images triées par priorité (principale en premier)
     */
    @GetMapping
    public ResponseEntity<List<ParcelImage>> getParcelImages(@PathVariable String parcelId) {
        List<ParcelImage> images = parcelImageRepository.findByParcelIdOrderByIsPrimaryDescDisplayOrderAsc(parcelId);
        return ResponseEntity.ok(images);
    }

    /**
     * Télécharge une nouvelle image pour une parcelle.
     * Nécessite les droits d'administration.
     *
     * @param parcelId identifiant de la parcelle
     * @param file fichier image à télécharger
     * @param description description optionnelle de l'image
     * @param isPrimary indique si l'image est principale
     * @param displayOrder ordre d'affichage
     * @return l'image créée ou erreur
     */
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

    /**
     * Récupère le fichier d'une image de parcelle.
     *
     * @param parcelId identifiant de la parcelle
     * @param imageId identifiant de l'image
     * @return le fichier image ou erreur 404
     */
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

    /**
     * Met à jour les métadonnées d'une image de parcelle.
     * Nécessite les droits d'administration.
     *
     * @param parcelId identifiant de la parcelle
     * @param imageId identifiant de l'image
     * @param description nouvelle description
     * @param isPrimary nouveau statut principal
     * @param displayOrder nouvel ordre d'affichage
     * @return l'image mise à jour ou erreur
     */
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

    /**
     * Supprime une image de parcelle et son fichier associé.
     * Nécessite les droits d'administration.
     *
     * @param parcelId identifiant de la parcelle
     * @param imageId identifiant de l'image à supprimer
     * @return réponse vide ou erreur
     */
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