// src/main/java/com/tessera/backend/config/EnvironmentConfig.java
package com.tessera.backend.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.PropertiesPropertySource;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import jakarta.annotation.PostConstruct;
import java.io.FileInputStream;
import java.io.IOException;
import java.util.Properties;

@Configuration
public class EnvironmentConfig {

    private final ConfigurableEnvironment environment;
    private static final Logger logger = LoggerFactory.getLogger(EnvironmentConfig.class);

    // Injeta o valor da propriedade 'app.jwt.secret' do application.properties
    @Value("${app.jwt.secret}")
    private String jwtSecret;

    public EnvironmentConfig(ConfigurableEnvironment environment) {
        this.environment = environment;
    }

    @PostConstruct
    public void loadDotEnvAndValidate() {
        // Tenta carregar o arquivo .env para sobrescrever propriedades, útil para desenvolvimento local.
        try {
            Properties envProps = new Properties();
            FileInputStream input = new FileInputStream(".env");
            envProps.load(input);
            input.close();

            PropertiesPropertySource envPropertySource = new PropertiesPropertySource("dotenv", envProps);
            environment.getPropertySources().addFirst(envPropertySource);
            logger.info("✅ Arquivo .env carregado com sucesso!");

            // Re-resolve as propriedades após carregar o .env
            this.jwtSecret = environment.getProperty("app.jwt.secret", "");

        } catch (IOException e) {
            logger.warn("⚠️  Aviso: Não foi possível carregar o arquivo .env. Usando configurações do application.properties ou variáveis de ambiente do sistema.");
        }

        validateRequiredEnvironment();
    }

    private void validateRequiredEnvironment() {
        logger.info("Verificando configurações de ambiente...");

        // Validação Crítica: Segredo JWT
        if (jwtSecret == null || jwtSecret.isEmpty() || jwtSecret.equals("fallback-secret-key-for-development-only-is-very-long-and-secure")) {
            logger.error("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
            logger.error("!!! VULNERABILIDADE CRÍTICA: JWT_SECRET não está configurado ou usa o valor padrão.     !!!");
            logger.error("!!! Defina a variável de ambiente 'APP_JWT_SECRET' com um valor longo e aleatório.         !!!");
            logger.error("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
            // Em um ambiente de produção real, você poderia lançar uma exceção para impedir a inicialização
            // throw new IllegalStateException("JWT_SECRET must be configured for production.");
        } else {
            logger.info("✅ Segredo JWT configurado corretamente.");
        }

        // Validação Informativa: Configuração de Email
        if (environment.getProperty("spring.mail.username") == null || environment.getProperty("spring.mail.username").isEmpty()) {
            logger.info("ℹ️  INFO: MAIL_USERNAME não configurado. Funcionalidades de email serão limitadas.");
        } else {
             logger.info("✅ Configuração de Email detectada.");
        }
    }
}