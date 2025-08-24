package com.industria.platform.service;

import com.industria.platform.config.OidcProperties;
import com.industria.platform.dto.LoginRequest;
import com.industria.platform.dto.LoginResponse;
import com.industria.platform.dto.RefreshTokenRequest;
import com.industria.platform.dto.UserDto;
import com.industria.platform.entity.User;
import com.industria.platform.exception.AuthenticationException;
import com.industria.platform.oidc.OidcTokenClient;
import com.industria.platform.oidc.TokenResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final OidcTokenClient oidc;
    private final OidcProperties props;
    private final JwtDecoder jwtDecoder;
    private final UserProvisioningService userProvisioningService;

    public LoginResponse login(LoginRequest request) {
        try {
            TokenResponse tr = oidc.tokenWithPassword(request.email(), request.password());
            Jwt jwt = decodePreferIdOrAccess(tr);

            User user = userProvisioningService.upsertFromClaims(jwt.getClaims(), props.getResource());
            Integer zoneCount = (user.getRole() != null && user.getRole().name().equals("ZONE_MANAGER"))
                    ? null // replace with repo count if needed
                    : null;

            UserDto userInfo = userProvisioningService.toUserDto(user, zoneCount);

            return new LoginResponse(
                    tr.accessToken(),
                    tr.refreshToken(),
                    tr.expiresIn(),
                    tr.tokenType() != null ? tr.tokenType() : "Bearer",
                    userInfo
            );
        } catch (org.springframework.web.client.HttpClientErrorException.Unauthorized e) {
            log.warn("Login failed: bad credentials (status={})", HttpStatus.UNAUTHORIZED.value());
            throw new AuthenticationException("Email ou mot de passe incorrect");
        } catch (Exception e) {
            log.error("Login error: {}", e.getMessage());
            throw new AuthenticationException("Erreur lors de l'authentification");
        }
    }

    public LoginResponse refreshToken(RefreshTokenRequest request) {
        try {
            TokenResponse tr = oidc.refresh(request.refreshToken());
            Jwt jwt = decodePreferIdOrAccess(tr);

            User user = userProvisioningService.upsertFromClaims(jwt.getClaims(), props.getResource());
            Integer zoneCount = (user.getRole() != null && user.getRole().name().equals("ZONE_MANAGER"))
                    ? null
                    : null;

            UserDto userInfo = userProvisioningService.toUserDto(user, zoneCount);

            return new LoginResponse(
                    tr.accessToken(),
                    tr.refreshToken(),
                    tr.expiresIn(),
                    tr.tokenType() != null ? tr.tokenType() : "Bearer",
                    userInfo
            );
        } catch (org.springframework.web.client.HttpClientErrorException e) {
            log.warn("Refresh failed: {}", e.getStatusCode().value());
            throw new AuthenticationException("Token invalide ou expiré");
        } catch (Exception e) {
            log.error("Refresh error: {}", e.getMessage());
            throw new AuthenticationException("Erreur lors du rafraîchissement");
        }
    }

    /** Pass the REFRESH TOKEN here, not the access token. */
    public void logout(String refreshToken) {
        try {
            oidc.logout(refreshToken);
        } catch (Exception e) {
            log.info("Logout call to IdP failed: {}", e.getMessage());
        }
    }

    /** Use this in controllers that already have a validated Jwt via Spring Security. */
    public UserDto currentUserInfo(Jwt jwt) {
        User user = userProvisioningService.upsertFromClaims(jwt.getClaims(), props.getResource());
        Integer zoneCount = (user.getRole() != null && user.getRole().name().equals("ZONE_MANAGER"))
                ? null
                : null;
        return userProvisioningService.toUserDto(user, zoneCount);
    }

    private Jwt decodePreferIdOrAccess(TokenResponse tr) {
        String token = tr.idToken() != null ? tr.idToken() : tr.accessToken();
        if (token == null) throw new AuthenticationException("Réponse token invalide");
        return jwtDecoder.decode(token);
    }
}
