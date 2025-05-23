package com.tessera.backend.dto;

import java.time.LocalDateTime;
import com.tessera.backend.entity.NotificationPriority;
import com.tessera.backend.entity.NotificationType;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class NotificationDTO {
    
    private Long id;
    private String title;
    private String message;
    private NotificationType type;
    private NotificationPriority priority;
    private boolean read;
    private Long entityId;
    private String entityType;
    private String actionUrl;
    private String icon;
    private String priorityColor;
    
    // Informações do usuário que disparou a notificação
    private Long triggeredById;
    private String triggeredByName;
    
    private LocalDateTime createdAt;
    private LocalDateTime readAt;
    private LocalDateTime expiresAt;
    
    // Campos calculados/auxiliares
    private String timeAgo;
    private boolean isNew; // Se foi criada há menos de 1 hora
    private boolean isExpired;
}