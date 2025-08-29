package com.industria.platform.oidc;

import java.util.Map;

public record TokenResponse(
        String accessToken,
        String refreshToken,
        Long expiresIn,
        String tokenType,
        String idToken
) {
    @SuppressWarnings("unchecked")
    public static TokenResponse from(Map<String, Object> map) {
        if (map == null) throw new IllegalStateException("Empty token response");
        String access = (String) map.get("access_token");
        String refresh = (String) map.get("refresh_token");
        Long exp = map.get("expires_in") != null ? ((Number) map.get("expires_in")).longValue() : 0L;
        String type = map.getOrDefault("token_type", "Bearer").toString();
        String id = (String) map.get("id_token");
        return new TokenResponse(access, refresh, exp, type, id);
    }
}
