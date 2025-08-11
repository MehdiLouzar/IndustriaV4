package com.industria.platform.test;

import org.locationtech.jts.geom.Geometry;
import org.locationtech.jts.io.WKBReader;
import org.locationtech.jts.io.WKTWriter;

public class TestJTSConversion {
    public static void main(String[] args) {
        String wkbHex = "01030000204F66000001000000050000000000000068D819410000000040C2164100000000E0D819410000000040C2164100";
        
        try {
            System.out.println("Test conversion WKB -> WKT");
            System.out.println("WKB input: " + wkbHex.substring(0, 50) + "...");
            
            // Convertir hex en bytes
            byte[] wkbBytes = hexStringToByteArray(wkbHex);
            System.out.println("Bytes length: " + wkbBytes.length);
            
            // Parser avec JTS
            WKBReader reader = new WKBReader();
            Geometry geometry = reader.read(wkbBytes);
            System.out.println("Geometry type: " + geometry.getGeometryType());
            System.out.println("SRID: " + geometry.getSRID());
            
            // Convertir en WKT
            WKTWriter writer = new WKTWriter();
            String wkt = writer.write(geometry);
            System.out.println("WKT output: " + wkt);
            
        } catch (Exception e) {
            System.err.println("Erreur: " + e.getMessage());
            e.printStackTrace();
        }
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