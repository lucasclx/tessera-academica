// VERSÃO ALTERNATIVA DO NotificationService.java SEM WEBSOCKET
// Use esta versão se quiser rodar o sistema primeiro sem notificações em tempo real

package com.tessera.backend.service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.stream.Collectors;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.tessera.backend.dto.NotificationDTO;
import com.tessera.backend.dto.NotificationSummaryDTO;
import com.tessera.backend.entity.Notification;
import com.tessera.backend.entity.NotificationPriority;
import com.tessera.backend.entity.NotificationType;
import com.tessera.backend.entity.User;
import com.tessera.backend.entity.UserNotificationSettings;
import com.tessera.backend.exception.ResourceNotFoundException;
import com.tessera.backend.repository.NotificationRepository;
import com.tessera.backend.repository.UserNotificationSettingsRepository;

@Service
@Transactional
public class NotificationService {

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private UserNotificationSettingsRepository settingsRepository;

    @Autowired
    private EmailService emailService;

    // Criar nova notificação
    @Async
    public void createNotification(User user, NotificationType type, String title, String message, 
                                 User triggeredBy, Long entityId, String entityType, String actionUrl) {
        createNotification(user, type, title, message, triggeredBy, entityId, entityType, actionUrl, NotificationPriority.NORMAL, null);
    }

    @Async
    public void createNotification(User user, NotificationType type, String title, String message,
                                 User triggeredBy, Long entityId, String entityType, String actionUrl,
                                 NotificationPriority priority, LocalDateTime expiresAt) {
        
        // Verificar configurações do usuário
        UserNotificationSettings settings = getOrCreateUserSettings(user);
        
        if (!shouldCreateNotification(settings, type)) {
            return;
        }

        Notification notification = new Notification();
        notification.setUser(user);
        notification.setType(type);
        notification.setTitle(title != null ? title : type.getDefaultTitle());
        notification.setMessage(message);
        notification.setTriggeredBy(triggeredBy);
        notification.setEntityId(entityId);
        notification.setEntityType(entityType);
        notification.setActionUrl(actionUrl);
        notification.setPriority(priority);
        notification.setExpiresAt(expiresAt);

        notification = notificationRepository.save(notification);

        // Enviar email se configurado
        if (shouldSendEmail(settings, type)) {
            emailService.sendNotificationEmail(user, notification);
        }
    }

    // Buscar notificações não lidas
    public List<NotificationDTO> getUnreadNotifications(User user) {
        List<Notification> notifications = notificationRepository.findByUserAndReadFalseOrderByCreatedAtDesc(user);
        return notifications.stream().map(this::mapToDTO).collect(Collectors.toList());
    }

    // Buscar todas as notificações paginadas
    public Page<NotificationDTO> getAllNotifications(User user, Pageable pageable) {
        Page<Notification> notifications = notificationRepository.findByUserOrderByCreatedAtDesc(user, pageable);
        return notifications.map(this::mapToDTO);
    }

    // Marcar notificação como lida
    public void markAsRead(Long notificationId, User user) {
        Notification notification = notificationRepository.findByIdAndUser(notificationId, user)
                .orElseThrow(() -> new ResourceNotFoundException("Notificação não encontrada"));

        if (!notification.isRead()) {
            notification.setRead(true);
            notification.setReadAt(LocalDateTime.now());
            notificationRepository.save(notification);
        }
    }

    // Marcar todas as notificações como lidas
    public void markAllAsRead(User user) {
        notificationRepository.markAllAsReadForUser(user, LocalDateTime.now());
    }

    // Obter resumo das notificações
    public NotificationSummaryDTO getNotificationSummary(User user) {
        long unreadCount = notificationRepository.countByUserAndReadFalse(user);
        long totalCount = notificationRepository.countByUser(user);
        
        List<Notification> unreadNotifications = notificationRepository.findByUserAndReadFalseOrderByCreatedAtDesc(user);
        
        boolean hasUrgent = unreadNotifications.stream()
                .anyMatch(n -> n.getPriority() == NotificationPriority.URGENT || n.getPriority() == NotificationPriority.HIGH);
        
        long documentsCount = unreadNotifications.stream()
                .filter(n -> n.getType().name().startsWith("DOCUMENT") || n.getType().name().startsWith("VERSION"))
                .count();
        
        long commentsCount = unreadNotifications.stream()
                .filter(n -> n.getType().name().startsWith("COMMENT"))
                .count();
        
        long approvalsCount = unreadNotifications.stream()
                .filter(n -> n.getType() == NotificationType.DOCUMENT_APPROVED ||
                           n.getType() == NotificationType.USER_APPROVED)
                .count();

        return new NotificationSummaryDTO(unreadCount, totalCount, hasUrgent, documentsCount, commentsCount, approvalsCount);
    }

    // Deletar notificação
    public void deleteNotification(Long notificationId, User user) {
        Notification notification = notificationRepository.findByIdAndUser(notificationId, user)
                .orElseThrow(() -> new ResourceNotFoundException("Notificação não encontrada"));
        
        notificationRepository.delete(notification);
    }

    // Configurações de notificação
    public UserNotificationSettings getUserNotificationSettings(User user) {
        return getOrCreateUserSettings(user);
    }

    public UserNotificationSettings updateNotificationSettings(User user, UserNotificationSettings settings) {
        UserNotificationSettings existingSettings = getOrCreateUserSettings(user);
        
        // Atualizar os campos
        existingSettings.setEmailEnabled(settings.isEmailEnabled());
        existingSettings.setEmailDocumentUpdates(settings.isEmailDocumentUpdates());
        existingSettings.setEmailComments(settings.isEmailComments());
        existingSettings.setEmailApprovals(settings.isEmailApprovals());
        existingSettings.setBrowserEnabled(settings.isBrowserEnabled());
        existingSettings.setBrowserDocumentUpdates(settings.isBrowserDocumentUpdates());
        existingSettings.setBrowserComments(settings.isBrowserComments());
        existingSettings.setBrowserApprovals(settings.isBrowserApprovals());
        existingSettings.setDigestFrequency(settings.getDigestFrequency());
        existingSettings.setQuietHoursStart(settings.getQuietHoursStart());
        existingSettings.setQuietHoursEnd(settings.getQuietHoursEnd());
        
        return settingsRepository.save(existingSettings);
    }

    // Métodos auxiliares privados
    private UserNotificationSettings getOrCreateUserSettings(User user) {
        return settingsRepository.findByUser(user)
                .orElseGet(() -> {
                    UserNotificationSettings settings = new UserNotificationSettings();
                    settings.setUser(user);
                    return settingsRepository.save(settings);
                });
    }

    private boolean shouldCreateNotification(UserNotificationSettings settings, NotificationType type) {
        if (!settings.isBrowserEnabled()) {
            return false;
        }
        
        switch (type) {
            case DOCUMENT_CREATED:
            case DOCUMENT_SUBMITTED:
            case DOCUMENT_APPROVED:
            case DOCUMENT_REJECTED:
            case DOCUMENT_REVISION_REQUESTED:
            case VERSION_CREATED:
                return settings.isBrowserDocumentUpdates();
            case COMMENT_ADDED:
            case COMMENT_REPLIED:
            case COMMENT_RESOLVED:
                return settings.isBrowserComments();
            case USER_APPROVED:
            case USER_REJECTED:
                return settings.isBrowserApprovals();
            default:
                return true;
        }
    }

    private boolean shouldSendEmail(UserNotificationSettings settings, NotificationType type) {
        if (!settings.isEmailEnabled()) {
            return false;
        }
        
        switch (type) {
            case DOCUMENT_CREATED:
            case DOCUMENT_SUBMITTED:
            case DOCUMENT_APPROVED:
            case DOCUMENT_REJECTED:
            case DOCUMENT_REVISION_REQUESTED:
            case VERSION_CREATED:
                return settings.isEmailDocumentUpdates();
            case COMMENT_ADDED:
            case COMMENT_REPLIED:
            case COMMENT_RESOLVED:
                return settings.isEmailComments();
            case USER_APPROVED:
            case USER_REJECTED:
                return settings.isEmailApprovals();
            default:
                return true;
        }
    }

    // Mapear entidade para DTO
    private NotificationDTO mapToDTO(Notification notification) {
        NotificationDTO dto = new NotificationDTO();
        dto.setId(notification.getId());
        dto.setTitle(notification.getTitle());
        dto.setMessage(notification.getMessage());
        dto.setType(notification.getType());
        dto.setPriority(notification.getPriority());
        dto.setRead(notification.isRead());
        dto.setEntityId(notification.getEntityId());
        dto.setEntityType(notification.getEntityType());
        dto.setActionUrl(notification.getActionUrl());
        dto.setIcon(notification.getType().getIcon());
        dto.setPriorityColor(notification.getPriority().getColor());
        
        if (notification.getTriggeredBy() != null) {
            dto.setTriggeredById(notification.getTriggeredBy().getId());
            dto.setTriggeredByName(notification.getTriggeredBy().getName());
        }
        
        dto.setCreatedAt(notification.getCreatedAt());
        dto.setReadAt(notification.getReadAt());
        dto.setExpiresAt(notification.getExpiresAt());
        
        // Campos calculados
        dto.setTimeAgo(calculateTimeAgo(notification.getCreatedAt()));
        dto.setNew(notification.getCreatedAt().isAfter(LocalDateTime.now().minusHours(1)));
        dto.setExpired(notification.getExpiresAt() != null && 
                      notification.getExpiresAt().isBefore(LocalDateTime.now()));
        
        return dto;
    }
    
    private String calculateTimeAgo(LocalDateTime dateTime) {
        LocalDateTime now = LocalDateTime.now();
        long minutes = ChronoUnit.MINUTES.between(dateTime, now);
        long hours = ChronoUnit.HOURS.between(dateTime, now);
        long days = ChronoUnit.DAYS.between(dateTime, now);
        
        if (minutes < 1) {
            return "agora";
        } else if (minutes < 60) {
            return minutes + " min atrás";
        } else if (hours < 24) {
            return hours + " h atrás";
        } else if (days < 7) {
            return days + " dia" + (days > 1 ? "s" : "") + " atrás";
        } else {
            return dateTime.format(DateTimeFormatter.ofPattern("dd/MM/yyyy"));
        }
    }
}