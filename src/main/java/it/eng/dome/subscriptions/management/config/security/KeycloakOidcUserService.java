package it.eng.dome.subscriptions.management.config.security;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.client.oidc.userinfo.OidcUserRequest;
import org.springframework.security.oauth2.client.oidc.userinfo.OidcUserService;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;

import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

public class KeycloakOidcUserService extends OidcUserService {

    private final NimbusJwtDecoder jwtDecoder;
    private final String clientResource;

    public KeycloakOidcUserService(String jwkSetUri, String clientResource) {
        this.jwtDecoder = NimbusJwtDecoder.withJwkSetUri(jwkSetUri).build();
        this.clientResource = clientResource;
    }

    @Override
    public OidcUser loadUser(OidcUserRequest userRequest) {
        OidcUser oidcUser = super.loadUser(userRequest);

        Set<GrantedAuthority> mappedAuthorities = new HashSet<>();

        // add only client roles from "subscription-manager" group and resource_access
        if (userRequest.getAccessToken() != null) {
            Jwt jwt = jwtDecoder.decode(userRequest.getAccessToken().getTokenValue());

            Map<String, Object> resourceAccess = jwt.getClaim("resource_access");
            if (resourceAccess != null) {
                Map<String, Object> sm = (Map<String, Object>) resourceAccess.get(clientResource);
                if (sm != null) {
                    List<String> roles = (List<String>) sm.get("roles");
                    if (roles != null) {
                        roles.forEach(role ->
                                mappedAuthorities.add(new SimpleGrantedAuthority("ROLE_" + role))
                        );
                    }
                }
            }
        }

        return new org.springframework.security.oauth2.core.oidc.user.DefaultOidcUser(
                mappedAuthorities,
                oidcUser.getIdToken(),
                oidcUser.getUserInfo(),
                "preferred_username"
        );
    }
}