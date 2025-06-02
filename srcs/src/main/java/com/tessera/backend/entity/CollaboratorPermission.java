package com.tessera.backend.entity;

public enum CollaboratorPermission {
    READ_ONLY("Apenas Leitura", "Pode visualizar o documento e comentários"),
    READ_COMMENT("Leitura e Comentários", "Pode visualizar e comentar"),
    READ_WRITE("Leitura e Escrita", "Pode editar o documento"),
    FULL_ACCESS("Acesso Completo", "Pode gerenciar colaboradores e configurações");
    
    private final String displayName;
    private final String description;
    
    CollaboratorPermission(String displayName, String description) {
        this.displayName = displayName;
        this.description = description;
    }
    
    public String getDisplayName() { return displayName; }
    public String getDescription() { return description; }
    
    public boolean canRead() { return true; }
    
    public boolean canComment() {
        return this != READ_ONLY;
    }
    
    public boolean canWrite() {
        return this == READ_WRITE || this == FULL_ACCESS;
    }
    
    public boolean canManageCollaborators() {
        return this == FULL_ACCESS;
    }
    
    public boolean canChangeStatus() {
        return this == FULL_ACCESS;
    }
    
    public boolean canDeleteComments() {
        return this == READ_WRITE || this == FULL_ACCESS;
    }
}