// src/main/java/com/tessera/backend/entity/AuditLog.java
package com.tessera.backend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "audit_logs", indexes = {
    @Index(name = "idx_audit_user_id", columnList = "user_id"),
    @Index(name = "idx_audit_timestamp", columnList = "timestamp"),
    @Index(name = "idx_audit_action", columnList = "action"),
    @Index(name = "idx_audit_result", columnList = "result")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AuditLog {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "user_id")
    private Long userId;
    
    @Column(name = "user_email")
    private String userEmail;
    
    @Column(name = "user_name")
    private String userName;
    
    @Column(name = "user_roles")
    private String userRoles;
    
    @Column(nullable = false, length = 100)
    private String action;
    
    @Column(name = "resource_id")
    private String resourceId;
    
    @Column(columnDefinition = "TEXT")
    private String details;
    
    @Column(nullable = false, length = 50)
    private String result; // SUCCESS, UNAUTHORIZED, SUSPICIOUS, ERROR
    
    @Column(name = "error_message", columnDefinition = "TEXT")
    private String errorMessage;
    
    @Column(name = "ip_address", length = 45)
    private String ipAddress;
    
    @Column(name = "user_agent", columnDefinition = "TEXT")
    private String userAgent;
    
    @Column(name = "request_method", length = 10)
    private String requestMethod;
    
    @Column(name = "request_uri", columnDefinition = "TEXT")
    private String requestUri;
    
    @Column(name = "session_id")
    private String sessionId;
    
    @Column(name = "risk_score")
    private Integer riskScore;
    
    @Column(length = 20)
    private String environment; // dev, staging, prod
    
    @CreationTimestamp
    @Column(nullable = false)
    private LocalDateTime timestamp;
}