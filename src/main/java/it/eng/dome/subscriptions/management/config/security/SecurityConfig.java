package it.eng.dome.subscriptions.management.config.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableMethodSecurity(prePostEnabled = true)
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    JwtAuthenticationConverter jwtAuthenticationConverter() {
        JwtAuthenticationConverter converter = new JwtAuthenticationConverter();
        converter.setJwtGrantedAuthoritiesConverter(new JwtRoleConverter());
        return converter;
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))

                //necessary to disable csrf for non-browser clients
                .csrf(csrf -> csrf.disable())

                // same-origin cors not needed
                .cors(cors -> cors.disable())

                .authorizeHttpRequests(auth -> auth

                        // all static resources are permitted
                        .requestMatchers("/**", "/css/**", "/js/**", "/media/**").permitAll()

                        // all APIs under /management/** require authentication
                        .requestMatchers("/configuration", "/organizations/**", "/plans/**").authenticated()

                        // all other requests are permitted
                        .anyRequest().permitAll()
                )
                // enable resource server to use JWT tokens
                .oauth2ResourceServer(oauth2 ->
                        oauth2.jwt(jwt -> jwt.jwtAuthenticationConverter(jwtAuthenticationConverter()))
                );

        return http.build();
    }
}