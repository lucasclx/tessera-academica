package com.tessera.backend.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "user_notification_settings")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserNotificationSettings {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @OneToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
    
    // Configurações de email
    @Column(name = "email_enabled")
    private boolean emailEnabled = true;
    
    @Column(name = "email_document_updates")
    private boolean emailDocumentUpdates = true;
    
    @Column(name = "email_comments")
    private boolean emailComments = true;
    
    @Column(name = "email_approvals")
    private boolean emailApprovals = true;
    
    // Configurações de push/browser
    @Column(name = "browser_enabled")
    private boolean browserEnabled = true;
    
    @Column(name = "browser_document_updates")
    private boolean browserDocumentUpdates = true;
    
    @Column(name = "browser_comments")
    private boolean browserComments = true;
    
    @Column(name = "browser_approvals")
    private boolean browserApprovals = true;
    
    // Configurações gerais
    @Column(name = "digest_frequency")
    private String digestFrequency = "DAILY"; // NONE, DAILY, WEEKLY
    
    @Column(name = "quiet_hours_start")
    private String quietHoursStart = "22:00";
    
    @Column(name = "quiet_hours_end")
    private String quietHoursEnd = "08:00";
}