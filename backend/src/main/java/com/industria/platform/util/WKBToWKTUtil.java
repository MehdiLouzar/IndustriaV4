package com.industria.platform.util;

import lombok.experimental.UtilityClass;
import lombok.extern.slf4j.Slf4j;
import org.locationtech.jts.geom.Geometry;
import org.locationtech.jts.io.WKBReader;
import org.locationtech.jts.io.WKTWriter;

/**
 * Utilitaire de conversion WKB vers WKT.
 * 
 * Convertit les géométries du format Well-Known Binary (WKB)
 * vers le format Well-Known Text (WKT) en utilisant la bibliothèque JTS.
 * 
 * @author Industria Platform Team
 * @version 1.0
 * @since 1.0
 */
@UtilityClass
@Slf4j
public class WKBToWKTUtil {
    
    private static final WKBReader WKB_READER = new WKBReader();
    private static final WKTWriter WKT_WRITER = new WKTWriter();
    
    /**
     * Convertit une géométrie WKB hexadécimale vers WKT.
     * 
     * Détecte automatiquement si la chaîne d'entrée est déjà au format WKT
     * ou si elle nécessite une conversion depuis WKB.
     * 
     * @param wkbHex géométrie en format WKB hexadécimal ou WKT
     * @return géométrie convertie en WKT ou null si la conversion échoue
     */
    public static String convertWKBToWKT(String wkbHex) {
        if (wkbHex == null || wkbHex.trim().isEmpty()) {
            return null;
        }
        
        // Si c'est déjà du WKT, retourner tel quel
        if (wkbHex.startsWith("POLYGON") || wkbHex.startsWith("POINT") || wkbHex.startsWith("LINESTRING")) {
            return wkbHex;
        }
        
        // Convertir WKB hexadécimal en WKT
        if (wkbHex.matches("^[0-9A-Fa-f]+$")) {
            try {
                byte[] wkbBytes = hexStringToByteArray(wkbHex);
                Geometry geometry = WKB_READER.read(wkbBytes);
                String wkt = WKT_WRITER.write(geometry);
                log.debug("WKBToWKTUtil conversion réussie: {}...", wkt.substring(0, Math.min(100, wkt.length())));
                return wkt;
            } catch (Exception e) {
                log.error("WKBToWKTUtil conversion échouée: {}", e.getMessage());
                return null;
            }
        }
        
        return wkbHex;
    }
    
    /**
     * Convertit une chaîne hexadécimale en tableau d'octets.
     * 
     * @param hexString chaîne hexadécimale (ex: "01030000...")
     * @return tableau d'octets correspondant
     */
    private static byte[] hexStringToByteArray(String hexString) {
        int len = hexString.length();
        byte[] data = new byte[len / 2];
        for (int i = 0; i < len; i += 2) {
            data[i / 2] = (byte) ((Character.digit(hexString.charAt(i), 16) << 4)
                                 + Character.digit(hexString.charAt(i+1), 16));
        }
        return data;
    }
}