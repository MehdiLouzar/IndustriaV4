package com.industria.platform.oidc;

import com.industria.platform.config.OidcProperties;

import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;

import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.Map;

@Component
@RequiredArgsConstructor
public class OidcTokenClient {

    private final RestClient restClient;
    private final OidcProperties props;

    public TokenResponse tokenWithPassword(String username, String password) {
        MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
        form.add("grant_type", "password");
        form.add("client_id", props.getResource());
        form.add("username", username);
        form.add("password", password);
        form.add("scope", props.getScope());

        var builder = restClient.post()
                .uri(props.tokenUrl())
                .contentType(MediaType.APPLICATION_FORM_URLENCODED);

        if (!props.getCredentialsSecret().isEmpty()) {
            builder = builder.header("Authorization", basicAuth(props.getResource(), props.getCredentialsSecret()));
        }

        Map<String, Object> map = builder.body(form).retrieve().toEntity(Map.class).getBody();
        return TokenResponse.from(map);
    }

    public TokenResponse refresh(String refreshToken) {
        MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
        form.add("grant_type", "refresh_token");
        form.add("client_id", props.getResource());
        form.add("refresh_token", refreshToken);
        form.add("scope", props.getScope());

        var builder = restClient.post()
                .uri(props.tokenUrl())
                .contentType(MediaType.APPLICATION_FORM_URLENCODED);

        if (!props.getCredentialsSecret().isEmpty()) {
            builder = builder.header("Authorization", basicAuth(props.getResource(), props.getCredentialsSecret()));
        }

        Map<String, Object> map = builder.body(form).retrieve().toEntity(Map.class).getBody();
        return TokenResponse.from(map);
    }

    public void logout(String refreshToken) {
        MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
        form.add("client_id", props.getResource());
        form.add("refresh_token", refreshToken);

        var builder = restClient.post()
                .uri(props.logoutUrl())
                .contentType(MediaType.APPLICATION_FORM_URLENCODED);

        if (!props.getCredentialsSecret().isEmpty()) {
            builder = builder.header("Authorization", basicAuth(props.getResource(), props.getCredentialsSecret()));
        }

        builder.body(form).retrieve().toBodilessEntity();
    }

    private String basicAuth(String clientId, String secret) {
        String raw = clientId + ":" + secret;
        return "Basic " + Base64.getEncoder().encodeToString(raw.getBytes(StandardCharsets.UTF_8));
    }
}
