package com.tessera.backend.entity;

public enum NotificationPriority {
    LOW("Baixa", "#4CAF50"),
    NORMAL("Normal", "#2196F3"),
    HIGH("Alta", "#FF9800"),
    URGENT("Urgente", "#F44336");
    
    private final String label;
    private final String color;
    
    NotificationPriority(String label, String color) {
        this.label = label;
        this.color = color;
    }
    
    public String getLabel() {
        return label;
    }
    
    public String getColor() {
        return color;
    }
}