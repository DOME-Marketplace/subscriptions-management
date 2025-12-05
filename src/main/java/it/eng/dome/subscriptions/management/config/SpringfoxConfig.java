package it.eng.dome.subscriptions.management.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.info.BuildProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;

@Configuration
public class SpringfoxConfig {
	
	private final String TITLE = "Subscriptions Management";
	private final String DESCRIPTION = "Swagger REST APIs for the subscriptions-management software";
	
	@Autowired
    private BuildProperties buildProperties;

	@Bean
	public OpenAPI customOpenAPI() {
		
		String version = buildProperties.getVersion();

        return new OpenAPI()
                .info(new Info().title(TITLE)
                .description(DESCRIPTION)
                .version(version));
    }

}