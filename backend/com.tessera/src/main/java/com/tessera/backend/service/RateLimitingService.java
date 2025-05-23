// src/main/java/com/tessera/backend/service/RateLimitingService.java
package com.tessera.backend.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicLong;

@Service
public class RateLimitingService {
    
    private static final Logger logger = LoggerFactory.getLogger(RateLimitingService.class);
    
    // Configurações via environment variables
    @Value("${tessera.rate-limit.login.max-attempts:5}")
    private int maxLoginAttempts;
    
    @Value("${tessera.rate-limit.login.window-minutes:15}")
    private int loginWindowMinutes;
    
    @Value("${tessera.rate-limit.api.max-requests:100}")
    private int maxApiRequests;
    
    @Value("${tessera.rate-limit.api.window-minutes:1}")
    private int apiWindowMinutes;
    
    @Value("${tessera.rate-limit.document.max-creates:10}")
    private int maxDocumentCreates;
    
    @Value("${tessera.rate-limit.document.window-minutes:60}")
    private int documentWindowMinutes;
    
    @Value("${tessera.rate-limit.comment.max-creates:50}")
    private int maxCommentCreates;
    
    @Value("${tessera.rate-limit.comment.window-minutes:60}")
    private int commentWindowMinutes;
    
    // Maps para armazenar contadores em memória
    // Para produção, considere usar Redis ou outro cache distribuído
    private final ConcurrentHashMap<String, RequestTracker> apiTrackers = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, RequestTracker> loginTrackers = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, RequestTracker> documentTrackers = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, RequestTracker> commentTrackers = new ConcurrentHashMap<>();
    
 // src/main/java/com/tessera/backend/service/RateLimitingService.java (continuação)

/**
 * Classe para rastrear requisições por janela de tempo
 */
private static class RequestTracker {
    private final AtomicInteger count = new AtomicInteger(0);
    private final AtomicLong windowStart = new AtomicLong(System.currentTimeMillis());
    private final long windowSizeMs;
    
    public RequestTracker(long windowSizeMs) {
        this.windowSizeMs = windowSizeMs;
    }
    
    public boolean isAllowed(int maxRequests) {
        long now = System.currentTimeMillis();
        long currentWindowStart = windowStart.get();
        
        // Se a janela expirou, reiniciar
        if (now - currentWindowStart >= windowSizeMs) {
            if (windowStart.compareAndSet(currentWindowStart, now)) {
                count.set(1);
                return true;
            }
        }
        
        // Incrementar e verificar limite
        return count.incrementAndGet() <= maxRequests;
    }
    
    public int getCurrentCount() {
        long now = System.currentTimeMillis();
        if (now - windowStart.get() >= windowSizeMs) {
            return 0;
        }
        return count.get();
    }
    
    public long getTimeUntilReset() {
        long now = System.currentTimeMillis();
        long elapsed = now - windowStart.get();
        return Math.max(0, windowSizeMs - elapsed);
    }
}

// Métodos públicos para o serviço
public boolean isLoginAllowed(String identifier) {
    return checkRateLimit(loginTrackers, identifier, maxLoginAttempts, loginWindowMinutes * 60 * 1000L);
}

public boolean isApiRequestAllowed(String identifier) {
    return checkRateLimit(apiTrackers, identifier, maxApiRequests, apiWindowMinutes * 60 * 1000L);
}

public boolean isDocumentCreationAllowed(String identifier) {
    return checkRateLimit(documentTrackers, identifier, maxDocumentCreates, documentWindowMinutes * 60 * 1000L);
}

public boolean isCommentCreationAllowed(String identifier) {
    return checkRateLimit(commentTrackers, identifier, maxCommentCreates, commentWindowMinutes * 60 * 1000L);
}

private boolean checkRateLimit(ConcurrentHashMap<String, RequestTracker> trackers, 
                              String identifier, int maxRequests, long windowMs) {
    RequestTracker tracker = trackers.computeIfAbsent(identifier, 
        k -> new RequestTracker(windowMs));
    
    boolean allowed = tracker.isAllowed(maxRequests);
    
    if (!allowed) {
        logger.warn("Rate limit exceeded for identifier: {} (current: {}, max: {})", 
                   identifier, tracker.getCurrentCount(), maxRequests);
    }
    
    return allowed;
}

// Limpeza periódica de trackers antigos
@Scheduled(fixedRate = 300000) // 5 minutos
public void cleanupExpiredTrackers() {
    long now = System.currentTimeMillis();
    
    cleanupMap(apiTrackers, now, apiWindowMinutes * 60 * 1000L);
    cleanupMap(loginTrackers, now, loginWindowMinutes * 60 * 1000L);
    cleanupMap(documentTrackers, now, documentWindowMinutes * 60 * 1000L);
    cleanupMap(commentTrackers, now, commentWindowMinutes * 60 * 1000L);
}

private void cleanupMap(ConcurrentHashMap<String, RequestTracker> map, long now, long windowMs) {
    map.entrySet().removeIf(entry -> {
        RequestTracker tracker = entry.getValue();
        return tracker.getTimeUntilReset() == 0;
    });
}