package com.tessera.backend.event;

import java.time.LocalDateTime;

import com.tessera.backend.entity.NotificationPriority;
import com.tessera.backend.entity.NotificationType;
import com.tessera.backend.entity.User;

public record NotificationEvent(
        User user,
        NotificationType type,
        String title,
        String message,
        User triggeredBy,
        Long entityId,
        String entityType,
        String actionUrl,
        NotificationPriority priority,
        LocalDateTime expiresAt
) {}
