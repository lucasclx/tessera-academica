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

    public EnvironmentConfig(ConfigurableEnvironment environment) {
        this.environment = environment;
    }

    @Value("${JWT_SECRET:}")
    private String jwtSecret;

    @Value("${DB_PASSWORD:}")
    private String dbPassword;

    @Value("${MAIL_USERNAME:}")
    private String mailUsername;

    @PostConstruct
    public void loadDotEnvFile() {
        try {
            // Carrega o arquivo .env
            Properties envProps = new Properties();
            FileInputStream input = new FileInputStream(".env");
            envProps.load(input);
            input.close();

            // Adiciona as propriedades ao ambiente Spring
            PropertiesPropertySource envPropertySource = new PropertiesPropertySource("dotenv", envProps);
            environment.getPropertySources().addFirst(envPropertySource);

            logger.info("✅ Arquivo .env carregado com sucesso!");

            // Re-resolve as propriedades após carregar o .env
            this.jwtSecret = environment.getProperty("JWT_SECRET", "");
            this.dbPassword = environment.getProperty("DB_PASSWORD", "");
            this.mailUsername = environment.getProperty("MAIL_USERNAME", "");

        } catch (IOException e) {
            logger.warn("⚠️  Aviso: Não foi possível carregar o arquivo .env: {}", e.getMessage());
            logger.warn("💡 Certifique-se de que o arquivo .env existe na raiz do projeto");
        }

        validateEnvironment();
    }

    private void validateEnvironment() {
        if (jwtSecret.isEmpty() || jwtSecret.equals("fallback-secret-key-for-development-only")) {
            logger.warn("⚠️  AVISO: JWT_SECRET não configurado ou usando valor padrão inseguro!");
            logger.warn("   Configure a variável JWT_SECRET no arquivo .env");
        }

        if (dbPassword.isEmpty()) {
            logger.warn("⚠️  AVISO: DB_PASSWORD não configurado!");
            logger.warn("   Configure a variável DB_PASSWORD no arquivo .env");
        }

        if (mailUsername.isEmpty()) {
            logger.info("ℹ️  INFO: MAIL_USERNAME não configurado. Funcionalidades de email serão limitadas.");
        }

        logger.info("✅ Configuração de ambiente carregada:");
        logger.info("   - JWT configurado: {}", !jwtSecret.isEmpty());
        logger.info("   - Database configurado: {}", !dbPassword.isEmpty());
        logger.info("   - Email configurado: {}", !mailUsername.isEmpty());
    }
}