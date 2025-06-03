package com.tessera.backend.controller;

import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import com.tessera.backend.dto.NotificationDTO;
import com.tessera.backend.dto.NotificationSettingsDTO;
import com.tessera.backend.dto.NotificationSummaryDTO;
import com.tessera.backend.entity.User;
import com.tessera.backend.entity.UserNotificationSettings;
import com.tessera.backend.repository.UserRepository;
import com.tessera.backend.service.NotificationService;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/notifications")
public class NotificationController {

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private UserRepository userRepository;

    // Buscar resumo das notificações
    @GetMapping("/summary")
    public ResponseEntity<NotificationSummaryDTO> getNotificationSummary(Authentication authentication) {
        User currentUser = getCurrentUser(authentication);
        NotificationSummaryDTO summary = notificationService.getNotificationSummary(currentUser);
        return ResponseEntity.ok(summary);
    }

    // Buscar notificações não lidas
    @GetMapping("/unread")
    public ResponseEntity<List<NotificationDTO>> getUnreadNotifications(Authentication authentication) {
        User currentUser = getCurrentUser(authentication);
        List<NotificationDTO> notifications = notificationService.getUnreadNotifications(currentUser);
        return ResponseEntity.ok(notifications);
    }

    // Buscar todas as notificações com paginação
    @GetMapping
    public ResponseEntity<Page<NotificationDTO>> getAllNotifications(
            Authentication authentication, 
            Pageable pageable) {
        User currentUser = getCurrentUser(authentication);
        Page<NotificationDTO> notifications = notificationService.getAllNotifications(currentUser, pageable);
        return ResponseEntity.ok(notifications);
    }

    // Marcar notificação específica como lida
    @PutMapping("/{id}/read")
    public ResponseEntity<Void> markAsRead(
            @PathVariable Long id, 
            Authentication authentication) {
        User currentUser = getCurrentUser(authentication);
        notificationService.markAsRead(id, currentUser);
        return ResponseEntity.ok().build();
    }

    // Marcar todas as notificações como lidas
    @PutMapping("/read-all")
    public ResponseEntity<Void> markAllAsRead(Authentication authentication) {
        User currentUser = getCurrentUser(authentication);
        notificationService.markAllAsRead(currentUser);
        return ResponseEntity.ok().build();
    }

    // Deletar notificação
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteNotification(
            @PathVariable Long id, 
            Authentication authentication) {
        User currentUser = getCurrentUser(authentication);
        notificationService.deleteNotification(id, currentUser);
        return ResponseEntity.ok().build();
    }

    // Configurações de notificação
    @GetMapping("/settings")
    public ResponseEntity<NotificationSettingsDTO> getNotificationSettings(Authentication authentication) {
        User currentUser = getCurrentUser(authentication);
        NotificationSettingsDTO dto = notificationService.getUserNotificationSettings(currentUser);
        return ResponseEntity.ok(dto);
    }

    @PutMapping("/settings")
    public ResponseEntity<NotificationSettingsDTO> updateNotificationSettings(
            @Valid @RequestBody NotificationSettingsDTO settingsDTO,
            Authentication authentication) {
        User currentUser = getCurrentUser(authentication);
        UserNotificationSettings settingsEntity = mapDTOToSettingsEntity(settingsDTO);
        settingsEntity.setUser(currentUser);
        
        NotificationSettingsDTO responseDTO = notificationService.updateNotificationSettings(currentUser, settingsEntity);
        
        return ResponseEntity.ok(responseDTO);
    }

    // Métodos auxiliares
    private User getCurrentUser(Authentication authentication) {
        return userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado"));
    }

    // Mapper de DTO para Entidade UserNotificationSettings
    private UserNotificationSettings mapDTOToSettingsEntity(NotificationSettingsDTO dto) {
        UserNotificationSettings settings = new UserNotificationSettings();
        
        settings.setEmailEnabled(dto.isEmailEnabled());
        settings.setEmailDocumentUpdates(dto.isEmailDocumentUpdates());
        settings.setEmailComments(dto.isEmailComments());
        settings.setEmailApprovals(dto.isEmailApprovals());
        settings.setBrowserEnabled(dto.isBrowserEnabled());
        settings.setBrowserDocumentUpdates(dto.isBrowserDocumentUpdates());
        settings.setBrowserComments(dto.isBrowserComments());
        settings.setBrowserApprovals(dto.isBrowserApprovals());
        settings.setDigestFrequency(dto.getDigestFrequency());
        settings.setQuietHoursStart(dto.getQuietHoursStart());
        settings.setQuietHoursEnd(dto.getQuietHoursEnd());
        
        return settings;
    }
}