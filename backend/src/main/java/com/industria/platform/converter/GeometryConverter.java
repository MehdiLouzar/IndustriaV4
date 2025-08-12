package com.industria.platform.converter;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;
import lombok.extern.slf4j.Slf4j;
import org.locationtech.jts.geom.Geometry;
import org.locationtech.jts.io.WKBReader;
import org.locationtech.jts.io.WKTWriter;
import org.locationtech.jts.io.ParseException;

/**
 * Convertisseur JPA pour les géométries PostGIS.
 * 
 * Convertit automatiquement les géométries entre les formats
 * WKB (stockage base de données) et WKT (utilisation application).
 * 
 * @author Industria Platform Team
 * @version 1.0
 * @since 1.0
 */
@Converter
@Slf4j
public class GeometryConverter implements AttributeConverter<String, String> {

    private static final WKBReader WKB_READER = new WKBReader();
    private static final WKTWriter WKT_WRITER = new WKTWriter();

    /**
     * Convertit une géométrie WKT pour le stockage en base.
     * 
     * @param wktGeometry géométrie au format WKT
     * @return géométrie prête pour le stockage
     */
    @Override
    public String convertToDatabaseColumn(String wktGeometry) {
        return wktGeometry;
    }

    /**
     * Convertit une géométrie depuis la base vers l'entité.
     * 
     * Détecte automatiquement le format (WKT ou WKB) et effectue
     * la conversion nécessaire vers WKT.
     * 
     * @param dbData géométrie depuis la base de données
     * @return géométrie convertie en WKT
     */
    @Override
    public String convertToEntityAttribute(String dbData) {
        log.debug("GeometryConverter.convertToEntityAttribute appelé avec: {}", 
                 dbData != null ? dbData.substring(0, Math.min(50, dbData.length())) + "..." : "null");
        
        // Lors de la lecture, vérifier si c'est du WKB et le convertir
        if (dbData == null || dbData.trim().isEmpty()) {
            log.debug("Géométrie null ou vide, retour tel quel");
            return dbData;
        }
        
        // Si c'est déjà du WKT, retourner tel quel
        if (dbData.startsWith("POLYGON") || dbData.startsWith("POINT") || dbData.startsWith("LINESTRING")) {
            log.debug("Déjà en format WKT, retour tel quel");
            return dbData;
        }
        
        // Si c'est du WKB (format hexadécimal), essayer de le convertir
        if (dbData.matches("^[0-9A-Fa-f]+$")) {
            log.debug("Format WKB détecté, tentative de conversion...");
            try {
                String result = convertWKBToWKT(dbData);
                log.debug("Conversion WKB->WKT réussie!");
                return result;
            } catch (Exception e) {
                log.error("Impossible de convertir WKB en WKT: {}", e.getMessage());
                return null;
            }
        }
        
        log.debug("Format inconnu, retour tel quel");
        return dbData;
    }
    
    /**
     * Convertit une géométrie WKB hexadécimale vers WKT.
     * 
     * @param wkbHex géométrie en format WKB hexadécimal
     * @return géométrie convertie en WKT
     * @throws ParseException si la conversion échoue
     */
    private String convertWKBToWKT(String wkbHex) throws ParseException {
        try {
            // Convertir la chaîne hexadécimale en bytes
            byte[] wkbBytes = hexStringToByteArray(wkbHex);
            
            // Parser le WKB avec JTS (JTS gère automatiquement le SRID PostGIS)
            Geometry geometry = WKB_READER.read(wkbBytes);
            
            // Convertir en WKT
            String wkt = WKT_WRITER.write(geometry);
            
            log.debug("Conversion WKB -> WKT réussie: {}...", wkt.substring(0, Math.min(100, wkt.length())));
            return wkt;
        } catch (Exception e) {
            log.error("Erreur conversion WKB -> WKT: {}", e.getMessage());
            throw new ParseException("Erreur lors de la conversion WKB vers WKT: " + e.getMessage(), e);
        }
    }
    
    /**
     * Convertit une chaîne hexadécimale en tableau d'octets.
     * 
     * @param hexString chaîne hexadécimale
     * @return tableau d'octets correspondant
     */
    private byte[] hexStringToByteArray(String hexString) {
        int len = hexString.length();
        byte[] data = new byte[len / 2];
        for (int i = 0; i < len; i += 2) {
            data[i / 2] = (byte) ((Character.digit(hexString.charAt(i), 16) << 4)
                                 + Character.digit(hexString.charAt(i+1), 16));
        }
        return data;
    }
}