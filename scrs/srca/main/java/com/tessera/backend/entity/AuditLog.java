package com.tessera.backend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "audit_logs") // Removendo indexes temporariamente
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AuditLog {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    // Informações do usuário
    @Column(name = "user_id")
    private Long userId;
    
    @Column(name = "user_email")
    private String userEmail;
    
    @Column(name = "user_name")
    private String userName;
    
    @Column(name = "user_roles")
    private String userRoles;
    
    // Informações da ação
    @Column(nullable = false)
    private String action;
    
    @Column(name = "resource_id")
    private String resourceId;
    
    @Column(columnDefinition = "TEXT")
    private String details;
    
    @Column(nullable = false)
    private String result; // SUCCESS, UNAUTHORIZED, SUSPICIOUS, ERROR
    
    @Column(name = "error_message", columnDefinition = "TEXT")
    private String errorMessage;
    
    // Informações da requisição
    @Column(name = "ip_address")
    private String ipAddress;
    
    @Column(name = "user_agent", columnDefinition = "TEXT")
    private String userAgent;
    
    @Column(name = "request_method")
    private String requestMethod;
    
    @Column(name = "request_uri")
    private String requestUri;
    
    @Column(name = "session_id")
    private String sessionId;
    
    // Metadados adicionais
    @Column(name = "risk_score")
    private Integer riskScore;
    
    @Column(name = "environment")
    private String environment;
    
    @CreationTimestamp
    @Column(nullable = false)
    private LocalDateTime timestamp;
    
    // Campos calculados para relatórios
    @Column(name = "processed")
    private Boolean processed = false;
    
    @Column(name = "notification_sent")
    private Boolean notificationSent = false;
}