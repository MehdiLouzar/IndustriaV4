package com.industria.platform.config;

import org.springframework.security.oauth2.core.OAuth2Error;
import org.springframework.security.oauth2.core.OAuth2TokenValidator;
import org.springframework.security.oauth2.core.OAuth2TokenValidatorResult;
import org.springframework.security.oauth2.jwt.Jwt;

public class JwtTypeValidator implements OAuth2TokenValidator<Jwt> {
    public OAuth2TokenValidatorResult validate(Jwt jwt) {
        String typ = jwt.getClaimAsString("typ");
        // Only accept access tokens, NOT ID tokens
        if (!"Bearer".equals(typ) && !"JWT".equals(typ)) {
            return OAuth2TokenValidatorResult.failure(
                    new OAuth2Error("invalid_token_type", "Not an access token", null)
            );
        }

        // Reject if it looks like an ID token
        if (jwt.hasClaim("nonce") || jwt.hasClaim("auth_time")) {
            return OAuth2TokenValidatorResult.failure(
                    new OAuth2Error("invalid_token_type", "ID token not accepted", null)
            );
        }

        return OAuth2TokenValidatorResult.success();
    }
}