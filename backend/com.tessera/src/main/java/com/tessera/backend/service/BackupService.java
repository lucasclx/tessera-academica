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

    @Value("${tessera.backup.path:/backups}") // Certifique-se que este diretório existe e tem permissão de escrita
    private String backupPath;

    @Value("${tessera.backup.retention-days:30}")
    private int retentionDays;

    @Value("${tessera.backup.mysqldump.path:mysqldump}") // Caminho para o executável mysqldump
    private String mysqldumpPath;

    // Injetar propriedades do datasource
    @Value("${spring.datasource.username}")
    private String dbUsername;

    @Value("${spring.datasource.password}")
    private String dbPassword;

    // Extrair host, port, dbName do spring.datasource.url ou adicionar propriedades específicas
    // Para simplificar, vamos assumir que você tem essas como propriedades separadas ou as extrairá
    // da URL do datasource se necessário. Por agora, usando placeholders.
    @Value("${DB_HOST:localhost}")
    private String dbHost;

    @Value("${DB_PORT:3306}")
    private String dbPort;

    @Value("${DB_NAME:tessera}")
    private String dbName;


    @Scheduled(cron = "${tessera.backup.schedule:0 2 * * * *}") // Default: 2 AM every day
    public void createDatabaseBackup() {
        if (!backupEnabled) {
            logger.info("Backup de banco de dados está desabilitado.");
            return;
        }
        if (dbUsername == null || dbUsername.isEmpty() || dbPassword == null || dbPassword.isEmpty()){
            logger.warn("Credenciais do banco de dados (usuário/senha) não configuradas para backup. Pulando.");
            return;
        }


        try {
            String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss"));
            String backupFileName = String.format("tessera_backup_%s.sql", timestamp);
            Path backupDir = Paths.get(backupPath);
            Path backupFilePath = backupDir.resolve(backupFileName);

            // Criar diretório se não existir
            if (!Files.exists(backupDir)) {
                Files.createDirectories(backupDir);
                logger.info("Diretório de backup criado em: {}", backupDir.toAbsolutePath());
            }

            logger.info("Iniciando backup do banco de dados para: {}", backupFilePath);

            ProcessBuilder pb = new ProcessBuilder(
                mysqldumpPath,
                "--user=" + dbUsername,
                "--password=" + dbPassword,
                "--host=" + dbHost,
                "--port=" + dbPort,
                "--single-transaction", // Garante consistência para InnoDB
                "--routines",           // Inclui stored procedures e functions
                "--triggers",           // Inclui triggers
                "--databases", dbName   // Especifica o banco de dados a ser "dumpado"
                                        // Usar --databases para incluir o "CREATE DATABASE" no dump
                                        // ou apenas o nome do banco para dumpar apenas as tabelas.
            );
            
            // Redirecionar a saída do processo para o arquivo de backup
            pb.redirectOutput(backupFilePath.toFile());
            // Redirecionar erros para o log do Java para depuração
            pb.redirectErrorStream(true); 


            Process process = pb.start();
            
            // Capturar a saída do processo (incluindo erros se redirectErrorStream(true))
            try (var reader = new java.io.BufferedReader(new java.io.InputStreamReader(process.getInputStream()))) {
                String line;
                while ((line = reader.readLine()) != null) {
                    logger.info("mysqldump output: {}", line);
                }
            }

            int exitCode = process.waitFor();

            if (exitCode == 0) {
                logger.info("Backup do banco de dados criado com sucesso: {}", backupFilePath.toAbsolutePath());
                cleanupOldBackups();
            } else {
                logger.error("Falha ao criar backup do banco de dados. Código de saída: {}. Verifique os logs do mysqldump.", exitCode);
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
                .filter(path -> path.getFileName().toString().startsWith("tessera_backup_") && path.getFileName().toString().endsWith(".sql"))
                .filter(path -> {
                    try {
                        // Extrair data do nome do arquivo
                        String fileName = path.getFileName().toString();
                        String datePart = fileName.substring("tessera_backup_".length(), fileName.indexOf(".sql"));
                        String dateOnly = datePart.substring(0, datePart.indexOf("_")); // "yyyyMMdd"
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