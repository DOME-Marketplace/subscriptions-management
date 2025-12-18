package it.eng.dome.subscriptions.management.controller;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;

@RestController
public class UserController {

    @GetMapping("/me")
    public Map<String, Object> me(Authentication authentication,
                                  @AuthenticationPrincipal OidcUser oidcUser) {

        if (authentication == null || oidcUser == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);
        }

        String username = oidcUser.getPreferredUsername();

        List<String> roles = authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .filter(role -> role.startsWith("ROLE_")) // consider only roles with "ROLE_" prefix
                .map(role -> role.substring(5)) // remove prefix "ROLE
                .toList();

        System.out.println("Username: " + username);
        System.out.println("Authorities: " + roles);

        return Map.of(
                "username", username,
                "roles", roles
        );
    }
}