// src/main/java/com/tessera/backend/config/EnvironmentConfig.java
package com.tessera.backend.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.PropertiesPropertySource;

import jakarta.annotation.PostConstruct;
import java.io.FileInputStream;
import java.io.IOException;
import java.util.Properties;

@Configuration
public class EnvironmentConfig {

    private final ConfigurableEnvironment environment;

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

            System.out.println("✅ Arquivo .env carregado com sucesso!");

            // Re-resolve as propriedades após carregar o .env
            this.jwtSecret = environment.getProperty("JWT_SECRET", "");
            this.dbPassword = environment.getProperty("DB_PASSWORD", "");
            this.mailUsername = environment.getProperty("MAIL_USERNAME", "");

        } catch (IOException e) {
            System.out.println("⚠️  Aviso: Não foi possível carregar o arquivo .env: " + e.getMessage());
            System.out.println("💡 Certifique-se de que o arquivo .env existe na raiz do projeto");
        }

        validateEnvironment();
    }

    private void validateEnvironment() {
        if (jwtSecret.isEmpty() || jwtSecret.equals("fallback-secret-key-for-development-only")) {
            System.err.println("⚠️  AVISO: JWT_SECRET não configurado ou usando valor padrão inseguro!");
            System.err.println("   Configure a variável JWT_SECRET no arquivo .env");
        }

        if (dbPassword.isEmpty()) {
            System.err.println("⚠️  AVISO: DB_PASSWORD não configurado!");
            System.err.println("   Configure a variável DB_PASSWORD no arquivo .env");
        }

        if (mailUsername.isEmpty()) {
            System.out.println("ℹ️  INFO: MAIL_USERNAME não configurado. Funcionalidades de email serão limitadas.");
        }

        System.out.println("✅ Configuração de ambiente carregada:");
        System.out.println("   - JWT configurado: " + (!jwtSecret.isEmpty()));
        System.out.println("   - Database configurado: " + (!dbPassword.isEmpty()));
        System.out.println("   - Email configurado: " + (!mailUsername.isEmpty()));
    }
}