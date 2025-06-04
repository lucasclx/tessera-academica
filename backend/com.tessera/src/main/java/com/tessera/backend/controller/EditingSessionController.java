package com.tessera.backend.controller;

import java.security.Principal;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.stereotype.Controller;

import com.tessera.backend.dto.EditingSessionDTO;
import com.tessera.backend.entity.User;
import com.tessera.backend.repository.UserRepository;
import com.tessera.backend.service.EditingSessionService;

@Controller
public class EditingSessionController {

    @Autowired
    private EditingSessionService editingSessionService;

    @Autowired
    private UserRepository userRepository;

    @MessageMapping("/editing/join")
    public void joinEditing(@Payload EditingSessionDTO message, Principal principal) {
        User user = getCurrentUser(principal);
        if (message.getDocumentId() != null && user != null) {
            editingSessionService.joinSession(message.getDocumentId(), user);
        }
    }

    @MessageMapping("/editing/leave")
    public void leaveEditing(@Payload EditingSessionDTO message, Principal principal) {
        User user = getCurrentUser(principal);
        if (message.getDocumentId() != null && user != null) {
            editingSessionService.leaveSession(message.getDocumentId(), user);
        }
    }

    private User getCurrentUser(Principal principal) {
        if (principal == null) return null;
        return userRepository.findByEmail(principal.getName()).orElse(null);
    }
}
