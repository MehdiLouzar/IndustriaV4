package com.industria.platform.converter;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;
import org.locationtech.jts.geom.Geometry;
import org.locationtech.jts.io.WKBReader;
import org.locationtech.jts.io.WKTWriter;
import org.locationtech.jts.io.ParseException;

@Converter
public class GeometryConverter implements AttributeConverter<String, String> {

    private static final WKBReader WKB_READER = new WKBReader();
    private static final WKTWriter WKT_WRITER = new WKTWriter();

    @Override
    public String convertToDatabaseColumn(String wktGeometry) {
        // Lors de la sauvegarde, garder tel quel
        return wktGeometry;
    }

    @Override
    public String convertToEntityAttribute(String dbData) {
        System.out.println("DEBUG: GeometryConverter.convertToEntityAttribute appelé avec: " + 
                          (dbData != null ? dbData.substring(0, Math.min(50, dbData.length())) + "..." : "null"));
        
        // Lors de la lecture, vérifier si c'est du WKB et le convertir
        if (dbData == null || dbData.trim().isEmpty()) {
            System.out.println("DEBUG: Géométrie null ou vide, retour tel quel");
            return dbData;
        }
        
        // Si c'est déjà du WKT, retourner tel quel
        if (dbData.startsWith("POLYGON") || dbData.startsWith("POINT") || dbData.startsWith("LINESTRING")) {
            System.out.println("DEBUG: Déjà en format WKT, retour tel quel");
            return dbData;
        }
        
        // Si c'est du WKB (format hexadécimal), essayer de le convertir
        if (dbData.matches("^[0-9A-Fa-f]+$")) {
            System.out.println("DEBUG: Format WKB détecté, tentative de conversion...");
            try {
                String result = convertWKBToWKT(dbData);
                System.out.println("DEBUG: Conversion WKB->WKT réussie!");
                return result;
            } catch (Exception e) {
                System.err.println("DEBUG: Impossible de convertir WKB en WKT: " + e.getMessage());
                e.printStackTrace();
                return null;
            }
        }
        
        System.out.println("DEBUG: Format inconnu, retour tel quel");
        return dbData;
    }
    
    private String convertWKBToWKT(String wkbHex) throws ParseException {
        try {
            // Convertir la chaîne hexadécimale en bytes
            byte[] wkbBytes = hexStringToByteArray(wkbHex);
            
            // Parser le WKB avec JTS (JTS gère automatiquement le SRID PostGIS)
            Geometry geometry = WKB_READER.read(wkbBytes);
            
            // Convertir en WKT
            String wkt = WKT_WRITER.write(geometry);
            
            System.out.println("DEBUG: Conversion WKB -> WKT réussie: " + wkt.substring(0, Math.min(100, wkt.length())) + "...");
            return wkt;
        } catch (Exception e) {
            System.err.println("DEBUG: Erreur conversion WKB -> WKT: " + e.getMessage());
            throw new ParseException("Erreur lors de la conversion WKB vers WKT: " + e.getMessage(), e);
        }
    }
    
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