package com.tessera.backend.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

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
    private final ConcurrentHashMap<String, RequestTracker> apiTrackers = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, RequestTracker> loginTrackers = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, RequestTracker> documentTrackers = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, RequestTracker> commentTrackers = new ConcurrentHashMap<>();
    
    /**
     * Classe interna para rastrear requests
     */
    private static class RequestTracker {
        private final AtomicInteger count = new AtomicInteger(0);
        private LocalDateTime windowStart;
        private final int windowMinutes;
        
        public RequestTracker(int windowMinutes) {
            this.windowMinutes = windowMinutes;
            this.windowStart = LocalDateTime.now();
        }
        
        public synchronized boolean isAllowed(int maxRequests) {
            LocalDateTime now = LocalDateTime.now();
            
            // Reset window if expired
            if (ChronoUnit.MINUTES.between(windowStart, now) >= windowMinutes) {
                count.set(0);
                windowStart = now;
            }
            
            int currentCount = count.incrementAndGet();
            return currentCount <= maxRequests;
        }
        
        public int getCurrentCount() {
            return count.get();
        }
        
        public LocalDateTime getWindowStart() {
            return windowStart;
        }
    }
    
    /**
     * Verifica se tentativa de login é permitida
     */
    public boolean isLoginAllowed(String identifier) {
        return checkRateLimit(loginTrackers, identifier, maxLoginAttempts, loginWindowMinutes, "LOGIN");
    }
    
    /**
     * Verifica se request de API é permitida
     */
    public boolean isApiRequestAllowed(String identifier) {
        return checkRateLimit(apiTrackers, identifier, maxApiRequests, apiWindowMinutes, "API");
    }
    
    /**
     * Verifica se criação de documento é permitida
     */
    public boolean isDocumentCreationAllowed(String identifier) {
        return checkRateLimit(documentTrackers, identifier, maxDocumentCreates, documentWindowMinutes, "DOCUMENT_CREATE");
    }
    
    /**
     * Verifica se criação de comentário é permitida
     */
    public boolean isCommentCreationAllowed(String identifier) {
        return checkRateLimit(commentTrackers, identifier, maxCommentCreates, commentWindowMinutes, "COMMENT_CREATE");
    }
    
    /**
     * Método genérico para verificar rate limit
     */
    private boolean checkRateLimit(ConcurrentHashMap<String, RequestTracker> trackers, 
                                  String identifier, int maxRequests, int windowMinutes, String action) {
        
        RequestTracker tracker = trackers.computeIfAbsent(identifier, 
            k -> new RequestTracker(windowMinutes));
        
        boolean allowed = tracker.isAllowed(maxRequests);
        
        if (!allowed) {
            logger.warn("Rate limit exceeded for {} - Action: {}, Count: {}/{}, Window: {} minutes", 
                       identifier, action, tracker.getCurrentCount(), maxRequests, windowMinutes);
        } else {
            logger.debug("Rate limit check passed for {} - Action: {}, Count: {}/{}", 
                        identifier, action, tracker.getCurrentCount(), maxRequests);
        }
        
        return allowed;
    }
    
    /**
     * Obtém informações do rate limit atual
     */
    public RateLimitInfo getRateLimitInfo(String identifier, String type) {
        ConcurrentHashMap<String, RequestTracker> trackers;
        int maxRequests;
        int windowMinutes;
        
        switch (type.toUpperCase()) {
            case "LOGIN":
                trackers = loginTrackers;
                maxRequests = maxLoginAttempts;
                windowMinutes = loginWindowMinutes;
                break;
            case "API":
                trackers = apiTrackers;
                maxRequests = maxApiRequests;
                windowMinutes = apiWindowMinutes;
                break;
            case "DOCUMENT":
                trackers = documentTrackers;
                maxRequests = maxDocumentCreates;
                windowMinutes = documentWindowMinutes;
                break;
            case "COMMENT":
                trackers = commentTrackers;
                maxRequests = maxCommentCreates;
                windowMinutes = commentWindowMinutes;
                break;
            default:
                return null;
        }
        
        RequestTracker tracker = trackers.get(identifier);
        if (tracker == null) {
            return new RateLimitInfo(0, maxRequests, LocalDateTime.now().plusMinutes(windowMinutes));
        }
        
        LocalDateTime resetTime = tracker.getWindowStart().plusMinutes(windowMinutes);
        return new RateLimitInfo(tracker.getCurrentCount(), maxRequests, resetTime);
    }
    
    /**
     * Limpa trackers expirados para liberar memória
     */
    public void cleanupExpiredTrackers() {
        LocalDateTime now = LocalDateTime.now();
        
        cleanupTrackersMap(apiTrackers, now, apiWindowMinutes);
        cleanupTrackersMap(loginTrackers, now, loginWindowMinutes);
        cleanupTrackersMap(documentTrackers, now, documentWindowMinutes);
        cleanupTrackersMap(commentTrackers, now, commentWindowMinutes);
        
        logger.debug("Cleanup de rate limit trackers concluído");
    }
    
    private void cleanupTrackersMap(ConcurrentHashMap<String, RequestTracker> trackers, 
                                   LocalDateTime now, int windowMinutes) {
        trackers.entrySet().removeIf(entry -> {
            LocalDateTime windowStart = entry.getValue().getWindowStart();
            return ChronoUnit.MINUTES.between(windowStart, now) > windowMinutes * 2; // Keep for 2 windows
        });
    }
    
    /**
     * Classe para informações do rate limit
     */
    public static class RateLimitInfo {
        private final int currentCount;
        private final int maxRequests;
        private final LocalDateTime resetTime;
        
        public RateLimitInfo(int currentCount, int maxRequests, LocalDateTime resetTime) {
            this.currentCount = currentCount;
            this.maxRequests = maxRequests;
            this.resetTime = resetTime;
        }
        
        public int getCurrentCount() { return currentCount; }
        public int getMaxRequests() { return maxRequests; }
        public LocalDateTime getResetTime() { return resetTime; }
        public int getRemainingRequests() { return Math.max(0, maxRequests - currentCount); }
        public boolean isLimitReached() { return currentCount >= maxRequests; }
    }
}