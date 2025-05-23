package com.tessera.backend.service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.stream.Collectors;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.tessera.backend.dto.NotificationDTO;
import com.tessera.backend.dto.NotificationSettingsDTO;
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

    private static final Logger logger = LoggerFactory.getLogger(NotificationService.class);

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private UserNotificationSettingsRepository settingsRepository;

    @Autowired
    private EmailService emailService;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @Async
    public void createNotification(User user, NotificationType type, String title, String message, 
                                 User triggeredBy, Long entityId, String entityType, String actionUrl) {
        createNotification(user, type, title, message, triggeredBy, entityId, entityType, actionUrl, NotificationPriority.NORMAL, null);
    }

    @Async
    public void createNotification(User user, NotificationType type, String title, String message,
                                 User triggeredBy, Long entityId, String entityType, String actionUrl,
                                 NotificationPriority priority, LocalDateTime expiresAt) {
        
        UserNotificationSettings settings = getOrCreateUserSettings(user);
        
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
        // notification.setRead(false); // Default is false due to 'isRead = false' in entity

        Notification savedNotification = notificationRepository.save(notification);
        logger.debug("Notificação salva no banco: {}", savedNotification.getId());

        NotificationDTO notificationDTO = mapEntityToDTO(savedNotification);

        if (shouldSendBrowserNotification(settings, type)) {
            String userDestination = "/user/" + user.getEmail() + "/topic/notifications";
            messagingTemplate.convertAndSend(userDestination, notificationDTO);
            logger.debug("Notificação enviada via WebSocket para {}: {}", userDestination, notificationDTO.getId());
        }

        if (shouldSendEmail(settings, type)) {
            emailService.sendNotificationEmail(user, savedNotification);
            logger.debug("Notificação por email solicitada para: {}", user.getEmail());
        }
        
        sendNotificationSummaryUpdate(user);
    }

    private void sendNotificationSummaryUpdate(User user) {
        NotificationSummaryDTO summary = getNotificationSummary(user);
        String summaryDestination = "/user/" + user.getEmail() + "/topic/notification-summary";
        messagingTemplate.convertAndSend(summaryDestination, summary);
        logger.debug("Resumo de notificações enviado para {}: {} não lidas", summaryDestination, summary.getUnreadCount());
    }

    public List<NotificationDTO> getUnreadNotifications(User user) {
        // CORRIGIDO: uses isRead
        List<Notification> notifications = notificationRepository.findByUserAndIsReadFalseOrderByCreatedAtDesc(user);
        return notifications.stream().map(this::mapEntityToDTO).collect(Collectors.toList());
    }

    public Page<NotificationDTO> getAllNotifications(User user, Pageable pageable) {
        Page<Notification> notifications = notificationRepository.findByUserOrderByCreatedAtDesc(user, pageable);
        return notifications.map(this::mapEntityToDTO);
    }

    public void markAsRead(Long notificationId, User user) {
        Notification notification = notificationRepository.findByIdAndUser(notificationId, user)
                .orElseThrow(() -> new ResourceNotFoundException("Notificação não encontrada com ID: " + notificationId + " para o usuário " + user.getEmail()));

        // CORRIGIDO: usa isRead
        if (!notification.isRead()) {
            notification.setRead(true); // Lombok setter for 'isRead' field
            notification.setReadAt(LocalDateTime.now());
            notificationRepository.save(notification);
            sendNotificationSummaryUpdate(user);
        }
    }

    public void markAllAsRead(User user) {
        int updatedCount = notificationRepository.markAllAsReadForUser(user, LocalDateTime.now());
        if (updatedCount > 0) {
            sendNotificationSummaryUpdate(user);
        }
    }

    public NotificationSummaryDTO getNotificationSummary(User user) {
        // CORRIGIDO: usa isRead
        long unreadCount = notificationRepository.countByUserAndIsReadFalse(user);
        long totalCount = notificationRepository.countByUser(user);
        
        // CORRIGIDO: usa isRead
        List<Notification> unreadNotifications = notificationRepository.findByUserAndIsReadFalseOrderByCreatedAtDesc(user);
        
        boolean hasUrgent = unreadNotifications.stream()
                .anyMatch(n -> n.getPriority() == NotificationPriority.URGENT);
        
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

    public void deleteNotification(Long notificationId, User user) {
        Notification notification = notificationRepository.findByIdAndUser(notificationId, user)
                .orElseThrow(() -> new ResourceNotFoundException("Notificação não encontrada com ID: " + notificationId + " para o usuário " + user.getEmail()));
        
        notificationRepository.delete(notification);
        sendNotificationSummaryUpdate(user); 
    }

    public NotificationSettingsDTO getUserNotificationSettings(User user) {
        UserNotificationSettings settingsEntity = getOrCreateUserSettings(user);
        return mapSettingsEntityToDTO(settingsEntity);
    }

    public NotificationSettingsDTO updateNotificationSettings(User user, UserNotificationSettings settingsEntityFromController) {
        UserNotificationSettings existingSettings = getOrCreateUserSettings(user);
        
        existingSettings.setEmailEnabled(settingsEntityFromController.isEmailEnabled());
        existingSettings.setEmailDocumentUpdates(settingsEntityFromController.isEmailDocumentUpdates());
        existingSettings.setEmailComments(settingsEntityFromController.isEmailComments());
        existingSettings.setEmailApprovals(settingsEntityFromController.isEmailApprovals());
        existingSettings.setBrowserEnabled(settingsEntityFromController.isBrowserEnabled());
        existingSettings.setBrowserDocumentUpdates(settingsEntityFromController.isBrowserDocumentUpdates());
        existingSettings.setBrowserComments(settingsEntityFromController.isBrowserComments());
        existingSettings.setBrowserApprovals(settingsEntityFromController.isBrowserApprovals());
        existingSettings.setDigestFrequency(settingsEntityFromController.getDigestFrequency());
        existingSettings.setQuietHoursStart(settingsEntityFromController.getQuietHoursStart());
        existingSettings.setQuietHoursEnd(settingsEntityFromController.getQuietHoursEnd());

        UserNotificationSettings savedSettings = settingsRepository.save(existingSettings);
        return mapSettingsEntityToDTO(savedSettings);
    }

    private UserNotificationSettings getOrCreateUserSettings(User user) {
        return settingsRepository.findByUser(user)
                .orElseGet(() -> {
                    UserNotificationSettings defaultSettings = new UserNotificationSettings();
                    defaultSettings.setUser(user);
                    return settingsRepository.save(defaultSettings);
                });
    }

    private boolean shouldSendBrowserNotification(UserNotificationSettings settings, NotificationType type) {
        if (!settings.isBrowserEnabled()) return false;
        if (type.name().contains("DOCUMENT") || type.name().contains("VERSION")) return settings.isBrowserDocumentUpdates();
        if (type.name().contains("COMMENT")) return settings.isBrowserComments();
        if (type == NotificationType.USER_APPROVED || type == NotificationType.USER_REJECTED || type == NotificationType.DOCUMENT_APPROVED) return settings.isBrowserApprovals();
        return true;
    }

    private boolean shouldSendEmail(UserNotificationSettings settings, NotificationType type) {
        if (!settings.isEmailEnabled()) return false;
        if (type.name().contains("DOCUMENT") || type.name().contains("VERSION")) return settings.isEmailDocumentUpdates();
        if (type.name().contains("COMMENT")) return settings.isEmailComments();
        if (type == NotificationType.USER_APPROVED || type == NotificationType.USER_REJECTED || type == NotificationType.DOCUMENT_APPROVED) return settings.isEmailApprovals();
        return true; 
    }

    private NotificationDTO mapEntityToDTO(Notification notification) {
        NotificationDTO dto = new NotificationDTO();
        dto.setId(notification.getId());
        dto.setTitle(notification.getTitle());
        dto.setMessage(notification.getMessage());
        dto.setType(notification.getType());
        dto.setPriority(notification.getPriority());
        // CORRIGIDO: usa isRead() getter
        dto.setRead(notification.isRead()); // Changed to dto.setRead for consistency, assuming DTO field is 'isRead'
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
        
        dto.setTimeAgo(calculateTimeAgo(notification.getCreatedAt()));
        dto.setNew(notification.getCreatedAt() != null && notification.getCreatedAt().isAfter(LocalDateTime.now().minusHours(1)));
        dto.setExpired(notification.getExpiresAt() != null && 
                      notification.getExpiresAt().isBefore(LocalDateTime.now()));
        
        return dto;
    }
    
    private NotificationSettingsDTO mapSettingsEntityToDTO(UserNotificationSettings settings) {
        NotificationSettingsDTO dto = new NotificationSettingsDTO();
        dto.setId(settings.getId());
        dto.setEmailEnabled(settings.isEmailEnabled());
        dto.setEmailDocumentUpdates(settings.isEmailDocumentUpdates());
        dto.setEmailComments(settings.isEmailComments());
        dto.setEmailApprovals(settings.isEmailApprovals());
        dto.setBrowserEnabled(settings.isBrowserEnabled());
        dto.setBrowserDocumentUpdates(settings.isBrowserDocumentUpdates());
        dto.setBrowserComments(settings.isBrowserComments());
        dto.setBrowserApprovals(settings.isBrowserApprovals());
        dto.setDigestFrequency(settings.getDigestFrequency());
        dto.setQuietHoursStart(settings.getQuietHoursStart());
        dto.setQuietHoursEnd(settings.getQuietHoursEnd());
        return dto;
    }

    private String calculateTimeAgo(LocalDateTime dateTime) {
        if (dateTime == null) return "";
        LocalDateTime now = LocalDateTime.now();
        long minutes = ChronoUnit.MINUTES.between(dateTime, now);
        if (minutes < 0) minutes = 0;

        long hours = ChronoUnit.HOURS.between(dateTime, now);
        if (hours < 0) hours = 0;

        long days = ChronoUnit.DAYS.between(dateTime, now);
        if (days < 0) days = 0;
        
        if (minutes < 1) return "agora";
        if (minutes < 60) return minutes + " min atrás";
        if (hours < 24) return hours + "h atrás";
        if (days < 7) return days + " dia" + (days > 1 ? "s" : "") + " atrás";
        return dateTime.format(DateTimeFormatter.ofPattern("dd/MM/yyyy"));
    }
}