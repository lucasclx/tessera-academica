package com.tessera.backend.service;

import com.tessera.backend.dto.NotificationSummaryDTO;
import com.tessera.backend.entity.*;
import com.tessera.backend.repository.NotificationRepository;
import com.tessera.backend.repository.UserNotificationSettingsRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import org.mockito.ArgumentMatchers;
import static org.mockito.Mockito.*;
import org.mockito.quality.Strictness;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)

@ExtendWith(MockitoExtension.class)
class NotificationServiceTest {

    @InjectMocks
    private NotificationService service;

    @Mock
    private NotificationRepository notificationRepository;
    @Mock
    private UserNotificationSettingsRepository settingsRepository;
    @Mock
    private EmailService emailService;
    @Mock
    private SimpMessagingTemplate messagingTemplate;

    private User user;
    private UserNotificationSettings settings;

    @BeforeEach
    void setup() {
        user = new User();
        user.setId(1L);
        user.setEmail("user@test.com");
        user.setName("User");
        settings = new UserNotificationSettings();
        settings.setUser(user);
        when(settingsRepository.findByUser(user)).thenReturn(Optional.of(settings));
    }

    @Test
    void testCreateNotification() {
        when(notificationRepository.save(any())).thenAnswer(inv->{Notification n=inv.getArgument(0);n.setId(1L);return n;});

        service.createNotification(user, NotificationType.DOCUMENT_CREATED, "t","m", null, 1L, "document", "/d/1");

        verify(notificationRepository).save(any(Notification.class));
        verify(emailService).sendNotificationEmail(eq(user), any(Notification.class));
        verify(messagingTemplate)
                .convertAndSend(eq("/user/"+user.getEmail()+"/topic/notifications"),
                                ArgumentMatchers.<Object>any());
        verify(messagingTemplate)
                .convertAndSend(eq("/user/"+user.getEmail()+"/topic/notification-summary"),
                                ArgumentMatchers.<Object>any());
    }

    @Test
    void testMarkAsRead() {
        Notification n = new Notification();
        n.setId(5L);
        n.setUser(user);
        n.setRead(false);
        when(notificationRepository.findByIdAndUser(5L, user)).thenReturn(Optional.of(n));

        service.markAsRead(5L, user);

        assertTrue(n.isRead());
        assertNotNull(n.getReadAt());
        verify(notificationRepository).save(n);
        verify(messagingTemplate)
                .convertAndSend(eq("/user/"+user.getEmail()+"/topic/notification-summary"),
                                ArgumentMatchers.<Object>any());
    }

    @Test
    void testMarkAllAsRead() {
        when(notificationRepository.markAllAsReadForUser(eq(user), any())).thenReturn(2);

        service.markAllAsRead(user);

        verify(messagingTemplate)
                .convertAndSend(eq("/user/"+user.getEmail()+"/topic/notification-summary"),
                                ArgumentMatchers.<Object>any());
    }

    @Test
    void testGetNotificationSummary() {
        List<Notification> unread = new ArrayList<>();
        Notification n1 = new Notification();
        n1.setPriority(NotificationPriority.NORMAL);
        n1.setType(NotificationType.DOCUMENT_CREATED);
        unread.add(n1);
        Notification n2 = new Notification();
        n2.setPriority(NotificationPriority.URGENT);
        n2.setType(NotificationType.DOCUMENT_APPROVED);
        unread.add(n2);
        Notification n3 = new Notification();
        n3.setPriority(NotificationPriority.NORMAL);
        n3.setType(NotificationType.COMMENT_ADDED);
        unread.add(n3);

        when(notificationRepository.countByUserAndIsReadFalse(user)).thenReturn(3L);
        when(notificationRepository.countByUser(user)).thenReturn(3L);
        when(notificationRepository.findByUserAndIsReadFalseOrderByCreatedAtDesc(user)).thenReturn(unread);

        NotificationSummaryDTO dto = service.getNotificationSummary(user);

        assertEquals(3, dto.getUnreadCount());
        assertTrue(dto.isHasUrgent());
        assertEquals(2, dto.getDocumentsCount());
        assertEquals(1, dto.getCommentsCount());
        assertEquals(1, dto.getApprovalsCount());
    }
}
