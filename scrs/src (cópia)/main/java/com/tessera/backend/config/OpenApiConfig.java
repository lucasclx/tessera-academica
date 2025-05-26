package com.tessera.backend.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI customOpenAPI() {
        final String securitySchemeName = "bearerAuth"; // Nome do esquema de segurança JWT

        return new OpenAPI()
                // Informações gerais da API
                .info(new Info().title("Tessera Academica API")
                        .version("v0.0.1") // Versão da sua API
                        .description("API para o sistema Tessera Academica, focado no gerenciamento de documentos e colaboração entre alunos e orientadores.")
                        .termsOfService("http://example.com/terms") // Substitua pela URL dos seus termos de serviço, se houver
                        .license(new License().name("Apache 2.0").url("https://www.apache.org/licenses/LICENSE-2.0.html"))) // Ou sua licença
                
                // Adiciona o item de segurança JWT globalmente
                .addSecurityItem(new SecurityRequirement().addList(securitySchemeName))
                
                // Define o esquema de segurança JWT
                .components(
                        new Components()
                                .addSecuritySchemes(securitySchemeName,
                                        new SecurityScheme()
                                                .name(securitySchemeName) // Mesmo nome usado em addSecurityItem
                                                .type(SecurityScheme.Type.HTTP) // Tipo de esquema: HTTP
                                                .scheme("bearer") // Esquema: Bearer
                                                .bearerFormat("JWT") // Formato do token: JWT
                                                .description("Insira o token JWT no seguinte formato: Bearer {seuTokenJWT}")
                                )
                );
    }
}