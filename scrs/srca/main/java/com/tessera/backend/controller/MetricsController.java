package com.tessera.backend.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

// ADICIONADO: Import necessário para ResponseEntity
import org.springframework.http.ResponseEntity;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/metrics")
public class MetricsController {
    
    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> getHealthMetrics() {
        Map<String, Object> metrics = new HashMap<>();
        metrics.put("status", "UP");
        metrics.put("timestamp", System.currentTimeMillis());
        metrics.put("application", "tessera-backend");
        metrics.put("version", "0.0.1-SNAPSHOT");
        
        return ResponseEntity.ok(metrics);
    }
    
    @GetMapping("/system")
    public ResponseEntity<Map<String, Object>> getSystemMetrics() {
        Map<String, Object> metrics = new HashMap<>();
        
        Runtime runtime = Runtime.getRuntime();
        metrics.put("memory", Map.of(
            "total", runtime.totalMemory(),
            "free", runtime.freeMemory(),
            "used", runtime.totalMemory() - runtime.freeMemory(),
            "max", runtime.maxMemory()
        ));
        
        metrics.put("processors", runtime.availableProcessors());
        metrics.put("uptime", System.currentTimeMillis());
        
        return ResponseEntity.ok(metrics);
    }
}