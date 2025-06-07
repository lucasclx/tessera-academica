package com.tessera.backend.service;

import com.tessera.backend.entity.User;
import com.tessera.backend.dto.EditingSessionDTO;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import java.util.Collection;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class EditingSessionServiceTest {

    @InjectMocks
    private EditingSessionService service;

    @Mock
    private SimpMessagingTemplate messagingTemplate;

    private User user;

    @BeforeEach
    void setup() {
        user = new User();
        user.setId(1L);
        user.setName("Tester");
    }

    @Test
    void testJoinAddsEditor() {
        service.joinSession(10L, user);

        Collection<EditingSessionDTO> editors = service.getEditors(10L);
        assertEquals(1, editors.size());
        assertEquals(user.getId(), editors.iterator().next().getUserId());
        verify(messagingTemplate).convertAndSend(eq("/topic/documents/10/editors"), any());
    }

    @Test
    void testCleanupRemovesIdleEditor() {
        service.joinSession(5L, user);
        // simulate idle
        service.getActiveEditors().get(5L).get(1L).setLastActive(System.currentTimeMillis() - service.getTimeoutMs() - 1000);

        service.cleanupIdleEditors();

        assertTrue(service.getEditors(5L).isEmpty());
        verify(messagingTemplate).convertAndSend(eq("/topic/documents/5/editors"), any());
    }

    @Test
    void testLeaveRemovesEditor() {
        service.joinSession(7L, user);
        service.leaveSession(7L, user);

        assertTrue(service.getEditors(7L).isEmpty());
        verify(messagingTemplate).convertAndSend(eq("/topic/documents/7/editors"), any());
    }
}
