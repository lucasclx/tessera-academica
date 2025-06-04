package com.tessera.backend.service;

import java.util.Collection;
import java.util.Collections;
import java.util.Map;
import java.util.stream.Collectors;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import com.tessera.backend.dto.EditingSessionDTO;
import com.tessera.backend.entity.User;

@Service
public class EditingSessionService {

    private final Map<Long, Map<Long, String>> activeEditors = new ConcurrentHashMap<>();

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    public void joinSession(Long documentId, User user) {
        activeEditors.computeIfAbsent(documentId, k -> new ConcurrentHashMap<>())
                     .put(user.getId(), user.getName());
        broadcast(documentId);
    }

    public void leaveSession(Long documentId, User user) {
        Map<Long, String> map = activeEditors.get(documentId);
        if (map != null) {
            map.remove(user.getId());
            if (map.isEmpty()) {
                activeEditors.remove(documentId);
            }
            broadcast(documentId);
        }
    }

    public boolean hasOtherEditors(Long documentId, Long userId) {
        Map<Long, String> map = activeEditors.get(documentId);
        if (map == null) return false;
        return map.size() > 1 || (map.size() == 1 && !map.containsKey(userId));
    }

    public Collection<EditingSessionDTO> getEditors(Long documentId) {
        Map<Long, String> map = activeEditors.getOrDefault(documentId, Collections.emptyMap());
        return map.entrySet().stream()
                   .map(e -> new EditingSessionDTO(documentId, e.getKey(), e.getValue()))
                   .collect(Collectors.toList());
    }

    public void broadcast(Long documentId) {
        Collection<EditingSessionDTO> editors = getEditors(documentId);
        String destination = "/topic/documents/" + documentId + "/editors";
        messagingTemplate.convertAndSend(destination, editors);
    }
}
