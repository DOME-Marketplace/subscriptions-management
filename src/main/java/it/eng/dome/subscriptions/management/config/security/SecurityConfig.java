package it.eng.dome.subscriptions.management.config.security;

import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.logout.LogoutSuccessHandler;

@Configuration
@EnableMethodSecurity(prePostEnabled = true)
@EnableWebSecurity
public class SecurityConfig {

    @Value("${keycloak.jwks-uri}")
    private String KEYCLOAK_JWKS_URI;
    @Value("${keycloak.client-resource}")
    private String KEYCLOAK_CLIENT_RESOURCE;

//    @Bean
//    JwtAuthenticationConverter jwtAuthenticationConverter() {
//        JwtAuthenticationConverter converter = new JwtAuthenticationConverter();
//        converter.setJwtGrantedAuthoritiesConverter(new JwtRoleConverter());
//        return converter;
//    }

    @Bean
    public SecurityFilterChain filterChain(
            HttpSecurity http,
            LogoutSuccessHandler oidcLogoutSuccessHandler
    ) throws Exception {

        http
                //necessary to disable csrf for non-browser clients
                .csrf(csrf -> csrf.disable())
                // same-origin cors not needed
                .cors(cors -> cors.disable())
                // authorize requests configuration
                .authorizeHttpRequests(auth -> auth
                        // all static resources are permitted
                        .requestMatchers(
                                "/subscriptions/",
                                "/auth/**",
                                "/login.html",
                                "/index.html",
                                "/css/**",
                                "/js/**",
                                "/media/**")
                        .permitAll()

                        // all APIs under /management/** require authentication
                        .requestMatchers(
                                "/configuration",
                                "/organizations/**",
                                "/plans/**",
                                "/me")
                        .authenticated()
                        // all other requests are permitted
                        .anyRequest().permitAll()
                )
                // OAuth2 login configuration
                .oauth2Login(oauth -> oauth
                        .loginPage("/login.html")
                        .userInfoEndpoint(userInfo ->
                                userInfo.oidcUserService(new KeycloakOidcUserService(KEYCLOAK_JWKS_URI, KEYCLOAK_CLIENT_RESOURCE))
                        )
                        .defaultSuccessUrl("/index.html", true)
                )
                // OAuth2 logout configuration
                .logout(logout -> logout
                        .logoutSuccessHandler(oidcLogoutSuccessHandler)
                        .deleteCookies("JSESSIONID")
                )
                .exceptionHandling(exception -> exception
                    .authenticationEntryPoint((request, response, authException) -> {
                        // if request is AJAX/Fetch, respond with 401 Unauthorized instead of redirecting to login page
                        response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Unauthorized");
                    })
                );

        return http.build();
    }
}