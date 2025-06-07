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
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Service
public class BackupService {

    private static final Logger logger = LoggerFactory.getLogger(BackupService.class);

    @Value("${tessera.backup.enabled:true}")
    private boolean backupEnabled;

    @Value("${tessera.backup.path:/backups}")
    private String backupPath;

    @Value("${tessera.backup.retention-days:30}")
    private int retentionDays;

    @Value("${tessera.backup.mysqldump.path:mysqldump}")
    private String mysqldumpPath;

    @Value("${spring.datasource.username}")
    private String dbUsername;

    @Value("${spring.datasource.password}")
    private String dbPassword;

    @Value("${DB_HOST:localhost}")
    private String dbHost;

    @Value("${DB_PORT:3306}")
    private String dbPort;

    @Value("${DB_NAME:tessera}")
    private String dbName;


    @Scheduled(cron = "${tessera.backup.schedule:0 2 * * * *}")
    public void createDatabaseBackup() {
        if (!backupEnabled) {
            logger.info("Backup de banco de dados está desabilitado.");
            return;
        }
        if (dbUsername == null || dbUsername.isEmpty()) {
            logger.warn("Nome de usuário do banco de dados não configurado para backup. Pulando.");
            return;
        }

        try {
            String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss"));
            String backupFileName = String.format("tessera_backup_%s.sql.gz", timestamp); // Comprimir backup
            Path backupDir = Paths.get(backupPath);
            Path backupFilePath = backupDir.resolve(backupFileName);

            if (!Files.exists(backupDir)) {
                Files.createDirectories(backupDir);
                logger.info("Diretório de backup criado em: {}", backupDir.toAbsolutePath());
            }

            logger.info("Iniciando backup do banco de dados para: {}", backupFilePath);
            
            // Usar gzip para comprimir o backup
            ProcessBuilder mysqldumpPb = new ProcessBuilder(
                mysqldumpPath,
                "--user=" + dbUsername,
                "--host=" + dbHost,
                "--port=" + dbPort,
                "--single-transaction",
                "--routines",
                "--triggers",
                dbName
            );

            // *** CORREÇÃO DE SEGURANÇA ***
            // Passar a senha via variável de ambiente para o processo, em vez de argumento de linha de comando
            mysqldumpPb.environment().put("MYSQL_PWD", dbPassword);
            
            ProcessBuilder gzipPb = new ProcessBuilder("gzip", "-c");
            gzipPb.redirectOutput(backupFilePath.toFile());
            
            // Iniciar os dois processos e conectá-los (pipe)
            Process mysqldumpProcess = mysqldumpPb.start();
            Process gzipProcess = gzipPb.start();

            try (var out = mysqldumpProcess.getInputStream(); var in = gzipProcess.getOutputStream()) {
                out.transferTo(in);
            }

            int mysqldumpExitCode = mysqldumpProcess.waitFor();
            int gzipExitCode = gzipProcess.waitFor();

            if (mysqldumpExitCode == 0 && gzipExitCode == 0) {
                logger.info("Backup do banco de dados criado e comprimido com sucesso: {}", backupFilePath.toAbsolutePath());
                cleanupOldBackups();
            } else {
                logger.error("Falha ao criar backup. Código de saída mysqldump: {}, gzip: {}.", mysqldumpExitCode, gzipExitCode);
            }

        } catch (IOException | InterruptedException e) {
            logger.error("Erro durante o processo de backup do banco de dados", e);
            if (e instanceof InterruptedException) {
                Thread.currentThread().interrupt();
            }
        }
    }

    private void cleanupOldBackups() {
        try {
            Path backupDir = Paths.get(backupPath);
            if (!Files.isDirectory(backupDir)) {
                return;
            }

            final LocalDateTime cutoffDate = LocalDateTime.now().minusDays(retentionDays);

            Files.list(backupDir)
                .filter(Files::isRegularFile)
                .filter(path -> path.getFileName().toString().matches("tessera_backup_.*\\.sql(\\.gz)?$"))
                .filter(path -> {
                    try {
                        String fileName = path.getFileName().toString();
                        String datePart = fileName.substring("tessera_backup_".length(), fileName.indexOf(".sql"));
                        String dateOnly = datePart.substring(0, datePart.indexOf("_"));
                        LocalDateTime fileDate = LocalDateTime.parse(dateOnly + "000000", DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));
                        return fileDate.isBefore(cutoffDate);
                    } catch (Exception e) {
                        logger.warn("Não foi possível parsear data do arquivo de backup: {}. Ignorando para limpeza.", path.getFileName(), e);
                        return false;
                    }
                })
                .forEach(oldBackup -> {
                    try {
                        Files.delete(oldBackup);
                        logger.info("Backup antigo removido: {}", oldBackup.toAbsolutePath());
                    } catch (IOException e) {
                        logger.error("Falha ao remover backup antigo: {}", oldBackup.toAbsolutePath(), e);
                    }
                });

        } catch (IOException e) {
            logger.error("Erro durante a limpeza de backups antigos", e);
        }
    }
}