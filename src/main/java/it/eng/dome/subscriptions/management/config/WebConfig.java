package it.eng.dome.subscriptions.management.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ViewControllerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Override
    public void addViewControllers(ViewControllerRegistry registry) {
        // "/" redirect to login.html directly
        registry.addRedirectViewController("/subscriptions", "/login.html");
        registry.addRedirectViewController("/subscriptions/", "/login.html");
    }
}