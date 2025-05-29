// src/main/java/com/tessera/backend/config/EnvironmentConfig.java
package com.tessera.backend.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.PropertySource;

import jakarta.annotation.PostConstruct;

@Configuration
@PropertySource(value = "file:.env", ignoreResourceNotFound = true)
public class EnvironmentConfig {

    @Value("${JWT_SECRET:}")
    private String jwtSecret;

    @Value("${DB_PASSWORD:}")
    private String dbPassword;

    @Value("${MAIL_USERNAME:}")
    private String mailUsername;

    @PostConstruct
    public void validateEnvironment() {
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