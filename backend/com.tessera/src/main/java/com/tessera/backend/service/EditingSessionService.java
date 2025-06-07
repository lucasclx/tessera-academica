package com.tessera.backend.service;

import java.util.Collection;
import java.util.Collections;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import com.tessera.backend.dto.EditingSessionDTO;
import com.tessera.backend.entity.User;

@Service
public class EditingSessionService {

    private static class EditorInfo {
        private final String name;
        private volatile long lastActive;

        EditorInfo(String name) {
            this.name = name;
            this.lastActive = System.currentTimeMillis();
        }

        void touch() {
            lastActive = System.currentTimeMillis();
        }

        void setLastActive(long lastActive) {
            this.lastActive = lastActive;
        }
    }

    private final Map<Long, Map<Long, EditorInfo>> activeEditors = new ConcurrentHashMap<>();

    @Value("${tessera.editing.timeout-ms:300000}")
    private long timeoutMs;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    public void joinSession(Long documentId, User user) {
        activeEditors
            .computeIfAbsent(documentId, k -> new ConcurrentHashMap<>())
            .compute(user.getId(), (k, v) -> {
                if (v == null) return new EditorInfo(user.getName());
                v.touch();
                return v;
            });
        broadcast(documentId);
    }

    public void leaveSession(Long documentId, User user) {
        Map<Long, EditorInfo> map = activeEditors.get(documentId);
        if (map != null) {
            map.remove(user.getId());
            if (map.isEmpty()) {
                activeEditors.remove(documentId);
            }
            broadcast(documentId);
        }
    }

    public boolean hasOtherEditors(Long documentId, Long userId) {
        Map<Long, EditorInfo> map = activeEditors.get(documentId);
        if (map == null) return false;
        return map.size() > 1 || (map.size() == 1 && !map.containsKey(userId));
    }

    public Collection<EditingSessionDTO> getEditors(Long documentId) {
        Map<Long, EditorInfo> map = activeEditors.getOrDefault(documentId, Collections.emptyMap());
        return map.entrySet().stream()
                   .map(e -> new EditingSessionDTO(documentId, e.getKey(), e.getValue().name))
                   .collect(Collectors.toList());
    }

    public void broadcast(Long documentId) {
        Collection<EditingSessionDTO> editors = getEditors(documentId);
        String destination = "/topic/documents/" + documentId + "/editors";
        messagingTemplate.convertAndSend(destination, editors);
    }

    Map<Long, Map<Long, EditorInfo>> getActiveEditors() {
        return activeEditors;
    }

    long getTimeoutMs() {
        return timeoutMs;
    }

    @Scheduled(fixedRateString = "${tessera.editing.cleanup-interval-ms:60000}")
    public void cleanupIdleEditors() {
        long now = System.currentTimeMillis();
        for (Map.Entry<Long, Map<Long, EditorInfo>> docEntry : activeEditors.entrySet()) {
            Long docId = docEntry.getKey();
            Map<Long, EditorInfo> map = docEntry.getValue();
            int before = map.size();
            map.entrySet().removeIf(e -> now - e.getValue().lastActive > timeoutMs);
            if (map.isEmpty()) {
                activeEditors.remove(docId);
            }
            if (before != map.size()) {
                broadcast(docId);
            }
        }
    }
}
