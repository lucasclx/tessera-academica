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
    
    /**
     * Classe