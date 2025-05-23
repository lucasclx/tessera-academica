package com.tessera.backend.entity;

import java.time.LocalDateTime;
import org.hibernate.annotations.CreationTimestamp;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "notifications") // Table name remains "notifications"
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Notification {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
    
    @Column(nullable = false)
    private String title;
    
    @Column(columnDefinition = "TEXT")
    private String message;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private NotificationType type;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private NotificationPriority priority = NotificationPriority.NORMAL;
    
    // CORRIGIDO: Renomeado o campo de 'read' para 'is_read' (no banco) ou 'isRead' (na entidade)
    // Usando @Column para definir o nome da coluna no banco como 'is_read' para evitar conflito.
    // O nome do campo na entidade será 'isRead'.
    @Column(name = "is_read") // Explicitly name the column in the database
    private boolean isRead = false; // Field name in Java
    
    @Column(name = "entity_id")
    private Long entityId; // ID do documento, versão, comentário etc.
    
    @Column(name = "entity_type")
    private String entityType; // "document", "version", "comment"
    
    @Column(name = "action_url")
    private String actionUrl; // URL para navegar quando clicar na notificação
    
    @ManyToOne
    @JoinColumn(name = "triggered_by")
    private User triggeredBy; // Usuário que causou a notificação
    
    @CreationTimestamp
    private LocalDateTime createdAt;
    
    private LocalDateTime readAt;
    
    private LocalDateTime expiresAt;
}