package com.industria.platform.config;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

@Validated
@ConfigurationProperties(prefix = "keycloak")
@Data
public class OidcProperties {

    @NotBlank private String authServerUrl;
    @NotBlank private String realm;
    @NotBlank private String resource;          // client_id
    private String credentialsSecret ;      // client_secret if used
    private String scope ;



    public String tokenUrl()   { return authServerUrl + "/realms/" + realm + "/protocol/openid-connect/token"; }
    public String userInfoUrl(){ return authServerUrl + "/realms/" + realm + "/protocol/openid-connect/userinfo"; }
    public String logoutUrl()  { return authServerUrl + "/realms/" + realm + "/protocol/openid-connect/logout"; }
}
