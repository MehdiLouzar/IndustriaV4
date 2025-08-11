package com.industria.platform.util;

import org.locationtech.jts.geom.Geometry;
import org.locationtech.jts.io.WKBReader;
import org.locationtech.jts.io.WKTWriter;

public class WKBToWKTUtil {
    
    private static final WKBReader WKB_READER = new WKBReader();
    private static final WKTWriter WKT_WRITER = new WKTWriter();
    
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
                System.out.println("DEBUG: WKBToWKTUtil conversion réussie: " + wkt.substring(0, Math.min(100, wkt.length())) + "...");
                return wkt;
            } catch (Exception e) {
                System.err.println("ERROR: WKBToWKTUtil conversion échouée: " + e.getMessage());
                return null;
            }
        }
        
        return wkbHex;
    }
    
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