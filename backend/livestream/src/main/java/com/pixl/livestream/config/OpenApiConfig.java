package com.pixl.livestream.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityScheme;

@Configuration
public class OpenApiConfig {

    @Bean
    OpenAPI livestreamOpenApi() {
        return new OpenAPI()
                .info(new Info()
                        .title("Pixl Livestream API")
                        .version("1.0.0")
                        .description("Self-hosted livestream control plane. Browser clients authenticate via Node-issued live tokens. Node uses X-Internal-Secret."))
                .components(new Components()
                        .addSecuritySchemes("liveToken", new SecurityScheme()
                                .type(SecurityScheme.Type.HTTP)
                                .scheme("bearer")
                                .bearerFormat("JWT"))
                        .addSecuritySchemes("internalSecret", new SecurityScheme()
                                .type(SecurityScheme.Type.APIKEY)
                                .in(SecurityScheme.In.HEADER)
                                .name("X-Internal-Secret")));
    }
}
