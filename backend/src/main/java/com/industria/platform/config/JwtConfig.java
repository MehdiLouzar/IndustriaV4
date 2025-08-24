package com.industria.platform.config;

import com.nimbusds.jose.jwk.source.JWKSource;
import com.nimbusds.jose.jwk.source.RemoteJWKSet;
import com.nimbusds.jose.proc.JWSKeySelector;
import com.nimbusds.jose.proc.JWSVerificationKeySelector;
import com.nimbusds.jose.proc.SecurityContext;
import com.nimbusds.jose.util.DefaultResourceRetriever;
import com.nimbusds.jwt.proc.ConfigurableJWTProcessor;
import com.nimbusds.jwt.proc.DefaultJWTProcessor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.oauth2.core.DelegatingOAuth2TokenValidator;

import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtValidators;
import org.springframework.security.oauth2.jwt.JwtAudienceValidator;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;

import java.net.MalformedURLException;
import java.net.URL;

import static com.nimbusds.jose.JWSAlgorithm.RS256;

@Configuration
public class JwtConfig {

    @Value("${keycloak.resource}")
    private String expectedAudience;

    @Value("${spring.security.oauth2.resourceserver.jwt.issuer-uri}")
    private String issuerUri;

    @Bean
    public JwtDecoder jwtDecoder(
            @Value("${spring.security.oauth2.resourceserver.jwt.jwk-set-uri}") String jwkSetUri
    ) throws MalformedURLException {
        // Create a custom JWT processor with caching
        ConfigurableJWTProcessor<SecurityContext> jwtProcessor = createJwtProcessor(jwkSetUri);

        // Create decoder with the custom processor
        NimbusJwtDecoder decoder = new NimbusJwtDecoder(jwtProcessor);

        // Configure validators
        decoder.setJwtValidator(new DelegatingOAuth2TokenValidator<>(
                JwtValidators.createDefaultWithIssuer(issuerUri),
                new JwtAudienceValidator(expectedAudience),
                new JwtTypeValidator() // Your custom validator for token type and algorithm
        ));

        return decoder;
    }

    private ConfigurableJWTProcessor<SecurityContext> createJwtProcessor(String jwkSetUri)
            throws MalformedURLException {
        // Create JWK source with timeout configuration
        DefaultResourceRetriever resourceRetriever = new DefaultResourceRetriever(
                5000,  // Connect timeout: 5 seconds
                5000   // Read timeout: 5 seconds
        );

        JWKSource<SecurityContext> jwkSource = new RemoteJWKSet<>(
                new URL(jwkSetUri),
                resourceRetriever
        );

        // Note: The RemoteJWKSet already includes caching with a default TTL of 5 minutes
        // If you need custom caching, you would need to implement it differently

        // Create JWT processor
        ConfigurableJWTProcessor<SecurityContext> jwtProcessor = new DefaultJWTProcessor<>();

        // Configure key selector for RS256 only
        JWSKeySelector<SecurityContext> jwsKeySelector =
                new JWSVerificationKeySelector<>(RS256, jwkSource);
        jwtProcessor.setJWSKeySelector(jwsKeySelector);

        return jwtProcessor;
    }
}