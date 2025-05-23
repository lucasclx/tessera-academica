// src/main/java/com/tessera/backend/service/BackupService.java
package com.tessera.backend.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@Service
public class BackupService {
    
    @Value("${tessera.backup.enabled:true}")
    private boolean backupEnabled;
    
    @Value("${tessera.backup.path:/backups}")
    private String backupPath;
    
    @Value("${tessera.backup.retention-days:30}")
    private int retentionDays;
    
    @Scheduled(cron = "${tessera.backup.schedule:0 2 * * * *}") // 2h da manhã
    public void createDatabaseBackup() {
        if (!backupEnabled) {
            return;
        }
        
        try {
            String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss"));
            String backupFileName = String.format("tessera_backup_%s.sql", timestamp);
            Path backupFilePath = Paths.get(backupPath, backupFileName);
            
            // Criar diretório se não existir
            Files.createDirectories(backupFilePath.getParent());
            
            // Executar backup (exemplo para MySQL)
            ProcessBuilder pb = new ProcessBuilder(
                "mysqldump",
                "--user=" + System.getProperty("DB_USERNAME"),
                "--password=" + System.getProperty("DB_PASSWORD"),
                "--host=" + System.getProperty("DB_HOST", "localhost"),
                "--port=" + System.getProperty("DB_PORT", "3306"),
                "--single-transaction",
                "--routines",
                "--triggers",
                System.getProperty("DB_NAME", "tessera")
            );
            
            pb.redirectOutput(backupFilePath.toFile());
            Process process = pb.start();
            int exitCode = process.waitFor();
            
            if (exitCode == 0) {
                logger.info("Backup criado com sucesso: {}", backupFilePath);
                cleanupOldBackups();
            } else {
                logger.error("Falha ao criar backup. Exit code: {}", exitCode);
            }
            
        } catch (IOException | InterruptedException e) {
            logger.error("Erro durante backup", e);
        }
    }
    
    private void cleanupOldBackups() {
        // Implementar limpeza de backups antigos
    }
}