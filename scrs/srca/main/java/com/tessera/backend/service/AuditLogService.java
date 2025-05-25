// src/main/java/com/tessera/backend/service/AuditLogService.java
package com.tessera.backend.service;

import com.tessera.backend.entity.AuditLog;
import com.tessera.backend.entity.User;
import com.tessera.backend.repository.AuditLogRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.time.LocalDateTime;

@Service
@Transactional
public class AuditLogService {
    
    private static final Logger logger = LoggerFactory.getLogger(AuditLogService.class);
    
    @Autowired
    private AuditLogRepository auditLogRepository;
    
    /**
     * Log de ação bem-sucedida
     */
    public void logSuccessfulAction(User user, String action, Object resourceId, String details) {
        createAuditLog(user, action, resourceId, details, "SUCCESS", null);
    }
    
    /**
     * Log de acesso não autorizado
     */
    public void logUnauthorizedAccess(User user, String action, Object resourceId, String reason) {
        createAuditLog(user, action, resourceId, reason, "UNAUTHORIZED", null);
        
        // Log adicional de segurança
        logger.warn("SECURITY ALERT: Acesso não autorizado - Usuário: {}, Ação: {}, Recurso: {}, Motivo: {}", 
                   user != null ? user.getEmail() : "UNKNOWN", action, resourceId, reason);
    }
    
    /**
     * Log de tentativa de ação (para monitoramento)
     */
    public void logAttemptedAction(User user, String action, String resourceId, String resourceType) {
        String details = String.format("Tentativa de %s em %s (ID: %s)", action, resourceType, resourceId);
        createAuditLog(user, action, resourceId, details, "ATTEMPTED", null);
    }
    
    /**
     * Log de erro do sistema
     */
    public void logSystemError(User user, String action, Object resourceId, String errorMessage) {
        createAuditLog(user, action, resourceId, errorMessage, "ERROR", errorMessage);
        
        // Log de erro para investigação
        logger.error("SYSTEM ERROR: Usuário: {}, Ação: {}, Recurso: {}, Erro: {}", 
                    user != null ? user.getEmail() : "SYSTEM", action, resourceId, errorMessage);
    }
    
    /**
     * Log de autenticação
     */
    public void logAuthentication(User user, String result, String details) {
        createAuditLog(user, "AUTHENTICATION", user != null ? user.getId() : null, details, result, null);
    }
    
    /**
     * Log de criação de recursos sensíveis
     */
    public void logResourceCreation(User user, String resourceType, Object resourceId, String details) {
        String action = "CREATE_" + resourceType.toUpperCase();
        createAuditLog(user, action, resourceId, details, "SUCCESS", null);
    }
    
    /**
     * Log de modificação de recursos sensíveis
     */
    public void logResourceModification(User user, String resourceType, Object resourceId, String changes) {
        String action = "MODIFY_" + resourceType.toUpperCase();
        createAuditLog(user, action, resourceId, changes, "SUCCESS", null);
    }
    
    /**
     * Log de exclusão de recursos
     */
    public void logResourceDeletion(User user, String resourceType, Object resourceId, String reason) {
        String action = "DELETE_" + resourceType.toUpperCase();
        createAuditLog(user, action, resourceId, reason, "SUCCESS", null);
    }
    
    /**
     * Log de alteração de status crítica
     */
    public void logStatusChange(User user, String resourceType, Object resourceId, String fromStatus, String toStatus) {
        String action = "STATUS_CHANGE_" + resourceType.toUpperCase();
        String details = String.format("Status alterado de %s para %s", fromStatus, toStatus);
        createAuditLog(user, action, resourceId, details, "SUCCESS", null);
    }
    
    /**
     * Log de export/download de dados sensíveis
     */
    public void logDataExport(User user, String dataType, String exportFormat, int recordCount) {
        String action = "DATA_EXPORT";
        String details = String.format("Exportação de %s registros de %s em formato %s", 
                                      recordCount, dataType, exportFormat);
        createAuditLog(user, action, null, details, "SUCCESS", null);
    }
    
    /**
     * Log de tentativas de acesso suspeitas
     */
    public void logSuspiciousActivity(User user, String activity, Object resourceId, String reason) {
        createAuditLog(user, "SUSPICIOUS_ACTIVITY", resourceId, activity + " - " + reason, "SUSPICIOUS", null);
        
        // Alert de segurança crítico
        logger.error("SECURITY CRITICAL: Atividade suspeita detectada - Usuário: {}, Atividade: {}, Recurso: {}, Motivo: {}", 
                    user != null ? user.getEmail() : "UNKNOWN", activity, resourceId, reason);
    }
    
    /**
     * Log de mudanças em configurações do sistema
     */
    public void logSystemConfigChange(User user, String configKey, String oldValue, String newValue) {
        String action = "SYSTEM_CONFIG_CHANGE";
        String details = String.format("Configuração '%s' alterada de '%s' para '%s'", configKey, oldValue, newValue);
        createAuditLog(user, action, configKey, details, "SUCCESS", null);
    }
    
    /**
     * Log de operações administrativas críticas
     */
    public void logAdminOperation(User user, String operation, Object targetId, String details) {
        String action = "ADMIN_OPERATION_" + operation.toUpperCase();
        createAuditLog(user, action, targetId, details, "SUCCESS", null);
        
        // Log especial para operações administrativas
        logger.info("ADMIN OPERATION: Usuário: {}, Operação: {}, Alvo: {}, Detalhes: {}", 
                   user.getEmail(), operation, targetId, details);
    }
    
    /**
     * Método principal para criar logs de auditoria
     */
    private void createAuditLog(User user, String action, Object resourceId, String details, String result, String errorMessage) {
        try {
            AuditLog auditLog = new AuditLog();
            
            // Informações do usuário
            if (user != null) {
                auditLog.setUserId(user.getId());
                auditLog.setUserEmail(user.getEmail());
                auditLog.setUserName(user.getName());
                
                // Extrair roles do usuário
                if (user.getRoles() != null && !user.getRoles().isEmpty()) {
                    String roles = user.getRoles().stream()
                        .map(role -> role.getName())
                        .reduce((r1, r2) -> r1 + "," + r2)
                        .orElse("");
                    auditLog.setUserRoles(roles);
                }
            }
            
            // Informações da ação
            auditLog.setAction(action);
            auditLog.setResourceId(resourceId != null ? resourceId.toString() : null);
            auditLog.setDetails(details);
            auditLog.setResult(result);
            auditLog.setErrorMessage(errorMessage);
            auditLog.setTimestamp(LocalDateTime.now());
            
            // Informações da requisição
            try {
                HttpServletRequest request = getCurrentRequest();
                if (request != null) {
                    auditLog.setIpAddress(getClientIpAddress(request));
                    auditLog.setUserAgent(request.getHeader("User-Agent"));
                    auditLog.setRequestMethod(request.getMethod());
                    auditLog.setRequestUri(request.getRequestURI());
                    auditLog.setSessionId(request.getSession(false) != null ? request.getSession().getId() : null);
                }
            } catch (Exception e) {
                // Se não conseguir obter informações da requisição, continua sem elas
                logger.debug("Não foi possível obter informações da requisição para auditoria: {}", e.getMessage());
            }
            
            // Salvar no banco de dados
            auditLogRepository.save(auditLog);
            
            // Log estruturado para ferramentas de monitoramento
            logStructuredAudit(auditLog);
            
        } catch (Exception e) {
            // Se falhar ao criar o log de auditoria, registra o erro mas não falha a operação principal
            logger.error("Erro ao criar log de auditoria: {}", e.getMessage(), e);
        }
    }
    
    /**
     * Obter a requisição HTTP atual
     */
    private HttpServletRequest getCurrentRequest() {
        try {
            ServletRequestAttributes attrs = (ServletRequestAttributes) RequestContextHolder.currentRequestAttributes();
            return attrs.getRequest();
        } catch (Exception e) {
            return null;
        }
    }
    
    /**
     * Extrair o IP real do cliente considerando proxies
     */
    private String getClientIpAddress(HttpServletRequest request) {
        String[] headerNames = {
            "X-Forwarded-For",
            "X-Real-IP", 
            "Proxy-Client-IP",
            "WL-Proxy-Client-IP",
            "HTTP_X_FORWARDED_FOR",
            "HTTP_X_FORWARDED",
            "HTTP_X_CLUSTER_CLIENT_IP",
            "HTTP_CLIENT_IP",
            "HTTP_FORWARDED_FOR",
            "HTTP_FORWARDED",
            "HTTP_VIA",
            "REMOTE_ADDR"
        };
        
        for (String header : headerNames) {
            String ip = request.getHeader(header);
            if (ip != null && !ip.isEmpty() && !"unknown".equalsIgnoreCase(ip)) {
                // Para X-Forwarded-For, pode conter múltiplos IPs separados por vírgula
                if (ip.contains(",")) {
                    ip = ip.split(",")[0].trim();
                }
                return ip;
            }
        }
        
        return request.getRemoteAddr();
    }
    
    /**
     * Log estruturado para integração com ferramentas de monitoramento (ELK, Splunk, etc.)
     */
    private void logStructuredAudit(AuditLog auditLog) {
        // JSON estruturado para fácil parsing por ferramentas de log
        String structuredLog = String.format(
            "AUDIT_LOG: {\"timestamp\":\"%s\", \"user\":\"%s\", \"userId\":%s, \"action\":\"%s\", " +
            "\"resource\":\"%s\", \"result\":\"%s\", \"ip\":\"%s\", \"userAgent\":\"%s\", " +
            "\"method\":\"%s\", \"uri\":\"%s\", \"details\":\"%s\"}",
            auditLog.getTimestamp(),
            auditLog.getUserEmail(),
            auditLog.getUserId(),
            auditLog.getAction(),
            auditLog.getResourceId(),
            auditLog.getResult(),
            auditLog.getIpAddress(),
            auditLog.getUserAgent(),
            auditLog.getRequestMethod(),
            auditLog.getRequestUri(),
            auditLog.getDetails() != null ? auditLog.getDetails().replace("\"", "\\\"") : ""
        );
        
        // Usar nível de log apropriado baseado no resultado
        switch (auditLog.getResult()) {
            case "UNAUTHORIZED":
            case "SUSPICIOUS":
                logger.warn(structuredLog);
                break;
            case "ERROR":
                logger.error(structuredLog);
                break;
            default:
                logger.info(structuredLog);
        }
    }
    
    /**
     * Buscar logs de auditoria para um usuário específico
     */
    @Transactional(readOnly = true)
    public java.util.List<AuditLog> getAuditLogsForUser(Long userId, int limit) {
        return auditLogRepository.findByUserIdOrderByTimestampDesc(userId, 
            org.springframework.data.domain.PageRequest.of(0, limit));
    }
    
    /**
     * Buscar logs de auditoria para uma ação específica
     */
    @Transactional(readOnly = true)
    public java.util.List<AuditLog> getAuditLogsForAction(String action, LocalDateTime since) {
        return auditLogRepository.findByActionAndTimestampAfterOrderByTimestampDesc(action, since);
    }
    
    /**
     * Buscar logs de segurança (não autorizados e suspeitos)
     */
    @Transactional(readOnly = true)
    public java.util.List<AuditLog> getSecurityLogs(LocalDateTime since) {
        return auditLogRepository.findSecurityLogsAfter(since);
    }
    
    /**
     * Contar tentativas de ação por usuário em um período
     */
    @Transactional(readOnly = true)
    public long countUserActionsInPeriod(Long userId, String action, LocalDateTime since) {
        return auditLogRepository.countByUserIdAndActionAndTimestampAfter(userId, action, since);
    }
    
    /**
     * Verificar se há atividade suspeita recente para um usuário
     */
    @Transactional(readOnly = true)
    public boolean hasSuspiciousActivityRecent(Long userId, int minutesBack) {
        LocalDateTime since = LocalDateTime.now().minusMinutes(minutesBack);
        long suspiciousCount = auditLogRepository.countByUserIdAndResultInAndTimestampAfter(
            userId, 
            java.util.Arrays.asList("UNAUTHORIZED", "SUSPICIOUS", "ERROR"), 
            since
        );
        
        // Considera suspeito se houver mais de 5 ações negativas em um período curto
        return suspiciousCount > 5;
    }
    
    /**
     * Limpar logs antigos (para manutenção do banco)
     */
    @Transactional
    public int cleanupOldAuditLogs(int daysToKeep) {
        LocalDateTime cutoffDate = LocalDateTime.now().minusDays(daysToKeep);
        
        // Manter sempre logs de segurança, mesmo antigos
        int deletedCount = auditLogRepository.deleteOldNonSecurityLogs(cutoffDate);
        
        logger.info("Limpeza de logs de auditoria: {} registros removidos (anteriores a {})", 
                   deletedCount, cutoffDate);
        
        return deletedCount;
    }
}