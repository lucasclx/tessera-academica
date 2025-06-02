// src/main/java/com/tessera/backend/entity/Permission.java
package com.tessera.backend.entity;

public enum Permission {
    // Documentos
    DOCUMENT_CREATE("document:create"),
    DOCUMENT_READ("document:read"),
    DOCUMENT_UPDATE("document:update"),
    DOCUMENT_DELETE("document:delete"),
    DOCUMENT_APPROVE("document:approve"),
    DOCUMENT_REVIEW("document:review"),
    
    // Usuários
    USER_MANAGE("user:manage"),
    USER_READ("user:read"),
    USER_APPROVE("user:approve"),
    
    // Comentários
    COMMENT_CREATE("comment:create"),
    COMMENT_READ("comment:read"),
    COMMENT_UPDATE("comment:update"),
    COMMENT_DELETE("comment:delete"),
    COMMENT_RESOLVE("comment:resolve"),
    
    // Sistema
    SYSTEM_CONFIG("system:config"),
    AUDIT_READ("audit:read");
    
    private final String permission;
    
    Permission(String permission) {
        this.permission = permission;
    }
    
    public String getPermission() {
        return permission;
    }
}