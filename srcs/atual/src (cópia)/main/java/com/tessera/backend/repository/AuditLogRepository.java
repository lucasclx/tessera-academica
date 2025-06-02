// src/main/java/com/tessera/backend/repository/AuditLogRepository.java
package com.tessera.backend.repository;

import com.tessera.backend.entity.AuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {
    
    // ========================================
    // CONSULTAS POR USUÁRIO
    // ========================================
    
    /**
     * Buscar logs de auditoria por usuário (paginado)
     */
    Page<AuditLog> findByUserId(Long userId, Pageable pageable);
    
    /**
     * Buscar logs de auditoria por usuário (limitado)
     */
    List<AuditLog> findByUserIdOrderByTimestampDesc(Long userId, Pageable pageable);
    
    /**
     * Buscar logs de auditoria por email do usuário
     */
    List<AuditLog> findByUserEmailOrderByTimestampDesc(String userEmail, Pageable pageable);
    
    /**
     * Contar ações de um usuário em um período
     */
    long countByUserIdAndTimestampAfter(Long userId, LocalDateTime since);
    
    /**
     * Contar ações específicas de um usuário em um período
     */
    long countByUserIdAndActionAndTimestampAfter(Long userId, String action, LocalDateTime since);
    
    /**
     * Contar resultados específicos de um usuário em um período
     */
    long countByUserIdAndResultInAndTimestampAfter(Long userId, List<String> results, LocalDateTime since);
    
    // ========================================
    // CONSULTAS POR AÇÃO
    // ========================================
    
    /**
     * Buscar logs por ação específica
     */
    List<AuditLog> findByActionOrderByTimestampDesc(String action, Pageable pageable);
    
    /**
     * Buscar logs por ação após uma data
     */
    List<AuditLog> findByActionAndTimestampAfterOrderByTimestampDesc(String action, LocalDateTime since);
    
    /**
     * Buscar logs por múltiplas ações
     */
    List<AuditLog> findByActionInOrderByTimestampDesc(List<String> actions, Pageable pageable);
    
    // ========================================
    // CONSULTAS DE SEGURANÇA
    // ========================================
    
    /**
     * Buscar logs de eventos de segurança
     */
    @Query("SELECT a FROM AuditLog a WHERE a.result IN ('UNAUTHORIZED', 'SUSPICIOUS', 'ERROR') " +
           "AND a.timestamp > :since ORDER BY a.timestamp DESC")
    List<AuditLog> findSecurityLogsAfter(@Param("since") LocalDateTime since);
    
    /**
     * Buscar tentativas de acesso não autorizado
     */
    List<AuditLog> findByResultAndTimestampAfterOrderByTimestampDesc(String result, LocalDateTime since);
    
    /**
     * Buscar atividades suspeitas por IP
     */
    @Query("SELECT a FROM AuditLog a WHERE a.ipAddress = :ipAddress " +
           "AND a.result IN ('UNAUTHORIZED', 'SUSPICIOUS') " +
           "AND a.timestamp > :since ORDER BY a.timestamp DESC")
    List<AuditLog> findSuspiciousActivitiesByIp(@Param("ipAddress") String ipAddress, 
                                                 @Param("since") LocalDateTime since);
    
    /**
     * Buscar múltiplas tentativas falhadas do mesmo IP
     */
    @Query("SELECT a.ipAddress, COUNT(a) as attempts FROM AuditLog a " +
           "WHERE a.result IN ('UNAUTHORIZED', 'ERROR') " +
           "AND a.timestamp > :since " +
           "GROUP BY a.ipAddress " +
           "HAVING COUNT(a) > :threshold " +
           "ORDER BY attempts DESC")
    List<Object[]> findIpsWithMultipleFailedAttempts(@Param("since") LocalDateTime since, 
                                                      @Param("threshold") long threshold);
    
    /**
     * Buscar usuários com atividade suspeita recente
     */
    @Query("SELECT a.userId, a.userEmail, COUNT(a) as incidents FROM AuditLog a " +
           "WHERE a.result IN ('UNAUTHORIZED', 'SUSPICIOUS') " +
           "AND a.timestamp > :since " +
           "AND a.userId IS NOT NULL " +
           "GROUP BY a.userId, a.userEmail " +
           "HAVING COUNT(a) > :threshold " +
           "ORDER BY incidents DESC")
    List<Object[]> findUsersWithSuspiciousActivity(@Param("since") LocalDateTime since, 
                                                    @Param("threshold") long threshold);
    
    // ========================================
    // CONSULTAS ESTATÍSTICAS
    // ========================================
    
    /**
     * Contar logs por resultado em um período
     */
    @Query("SELECT a.result, COUNT(a) FROM AuditLog a " +
           "WHERE a.timestamp BETWEEN :start AND :end " +
           "GROUP BY a.result")
    List<Object[]> countLogsByResultInPeriod(@Param("start") LocalDateTime start, 
                                             @Param("end") LocalDateTime end);
    
    /**
     * Contar logs por ação em um período
     */
    @Query("SELECT a.action, COUNT(a) FROM AuditLog a " +
           "WHERE a.timestamp BETWEEN :start AND :end " +
           "GROUP BY a.action " +
           "ORDER BY COUNT(a) DESC")
    List<Object[]> countLogsByActionInPeriod(@Param("start") LocalDateTime start, 
                                             @Param("end") LocalDateTime end);
    
    /**
     * Atividade por hora do dia
     */
    @Query("SELECT HOUR(a.timestamp) as hour, COUNT(a) as activity FROM AuditLog a " +
           "WHERE a.timestamp > :since " +
           "GROUP BY HOUR(a.timestamp) " +
           "ORDER BY hour")
    List<Object[]> getActivityByHour(@Param("since") LocalDateTime since);
    
    /**
     * Top usuários mais ativos
     */
    @Query("SELECT a.userEmail, COUNT(a) as activity FROM AuditLog a " +
           "WHERE a.timestamp > :since " +
           "AND a.userEmail IS NOT NULL " +
           "GROUP BY a.userEmail " +
           "ORDER BY activity DESC")
    List<Object[]> getTopActiveUsers(@Param("since") LocalDateTime since, Pageable pageable);
    
    // ========================================
    // CONSULTAS PARA DETECÇÃO DE ANOMALIAS
    // ========================================
    
    /**
     * Detectar logins fora do horário usual do usuário
     */
    @Query("SELECT a FROM AuditLog a WHERE a.userId = :userId " +
           "AND a.action = 'AUTHENTICATION' " +
           "AND (HOUR(a.timestamp) < :normalStartHour OR HOUR(a.timestamp) > :normalEndHour) " +
           "AND a.timestamp > :since " +
           "ORDER BY a.timestamp DESC")
    List<AuditLog> findOffHourAuthentications(@Param("userId") Long userId,
                                              @Param("normalStartHour") int normalStartHour,
                                              @Param("normalEndHour") int normalEndHour,
                                              @Param("since") LocalDateTime since);
    
    /**
     * Detectar acessos de IPs incomuns para um usuário
     */
    @Query("SELECT DISTINCT a.ipAddress FROM AuditLog a " +
           "WHERE a.userId = :userId " +
           "AND a.timestamp BETWEEN :start AND :end " +
           "AND a.ipAddress NOT IN (" +
           "    SELECT DISTINCT a2.ipAddress FROM AuditLog a2 " +
           "    WHERE a2.userId = :userId " +
           "    AND a2.timestamp < :start " +
           "    AND a2.timestamp > :historicalStart" +
           ")")
    List<String> findUnusualIpsForUser(@Param("userId") Long userId,
                                       @Param("start") LocalDateTime start,
                                       @Param("end") LocalDateTime end,
                                       @Param("historicalStart") LocalDateTime historicalStart);
    
    /**
     * Detectar volume anormal de atividade
     */
    @Query("SELECT a.userId, COUNT(a) as activityCount FROM AuditLog a " +
           "WHERE a.timestamp > :since " +
           "AND a.userId IS NOT NULL " +
           "GROUP BY a.userId " +
           "HAVING COUNT(a) > :threshold " +
           "ORDER BY activityCount DESC")
    List<Object[]> findUsersWithHighActivity(@Param("since") LocalDateTime since, 
                                             @Param("threshold") long threshold);
    
    // ========================================
    // LIMPEZA E MANUTENÇÃO
    // ========================================
    
    /**
     * Deletar logs antigos (exceto eventos de segurança)
     */
    @Modifying
    @Query("DELETE FROM AuditLog a WHERE a.timestamp < :cutoffDate " +
           "AND a.result NOT IN ('UNAUTHORIZED', 'SUSPICIOUS')")
    int deleteOldNonSecurityLogs(@Param("cutoffDate") LocalDateTime cutoffDate);
    
    /**
     * Contar logs por período (para estatísticas de armazenamento)
     */
    @Query("SELECT DATE(a.timestamp) as date, COUNT(a) as count FROM AuditLog a " +
           "WHERE a.timestamp BETWEEN :start AND :end " +
           "GROUP BY DATE(a.timestamp) " +
           "ORDER BY date")
    List<Object[]> countLogsByDate(@Param("start") LocalDateTime start, 
                                   @Param("end") LocalDateTime end);
    
    /**
     * Buscar logs com score de risco alto
     */
    List<AuditLog> findByRiskScoreGreaterThanOrderByTimestampDesc(Integer riskThreshold, Pageable pageable);
    
    /**
     * Buscar logs por ambiente (dev, staging, prod)
     */
    List<AuditLog> findByEnvironmentAndTimestampAfterOrderByTimestampDesc(String environment, 
                                                                          LocalDateTime since, 
                                                                          Pageable pageable);
    
    // ========================================
    // CONSULTAS PARA RELATÓRIOS
    // ========================================
    
    /**
     * Relatório de segurança - resumo por dia
     */
    @Query("SELECT DATE(a.timestamp) as date, a.result, COUNT(a) as count " +
           "FROM AuditLog a " +
           "WHERE a.timestamp BETWEEN :start AND :end " +
           "AND a.result IN ('SUCCESS', 'UNAUTHORIZED', 'SUSPICIOUS', 'ERROR') " +
           "GROUP BY DATE(a.timestamp), a.result " +
           "ORDER BY date, a.result")
    List<Object[]> getSecurityReportByDay(@Param("start") LocalDateTime start, 
                                          @Param("end") LocalDateTime end);
    
    /**
     * Relatório de atividade de usuários
     */
    @Query("SELECT a.userEmail, a.action, COUNT(a) as count " +
           "FROM AuditLog a " +
           "WHERE a.timestamp BETWEEN :start AND :end " +
           "AND a.userEmail IS NOT NULL " +
           "GROUP BY a.userEmail, a.action " +
           "ORDER BY a.userEmail, count DESC")
    List<Object[]> getUserActivityReport(@Param("start") LocalDateTime start, 
                                         @Param("end") LocalDateTime end);
}