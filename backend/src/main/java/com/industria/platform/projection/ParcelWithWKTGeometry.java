package com.industria.platform.projection;

import com.industria.platform.entity.ParcelStatus;
import org.springframework.beans.factory.annotation.Value;

public interface ParcelWithWKTGeometry {
    String getId();
    String getReference();
    Double getArea();
    ParcelStatus getStatus();
    Boolean getIsShowroom();
    String getZoneId();
    Double getLongitude();
    Double getLatitude();
    Double getCos();
    Double getCus();
    Double getHeightLimit();
    Double getSetback();
    
    // Utiliser SpEL pour transformer la géométrie WKB en WKT via une expression native
    @Value("#{T(com.industria.platform.util.WKBToWKTUtil).convertWKBToWKT(target.geometry)}")
    String getWktGeometry();
}