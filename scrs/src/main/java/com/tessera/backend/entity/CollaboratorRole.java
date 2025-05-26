package com.tessera.backend.entity;

public enum CollaboratorRole {
    PRIMARY_STUDENT("Estudante Principal", "O autor principal da monografia"),
    SECONDARY_STUDENT("Estudante Colaborador", "Estudante que colabora no desenvolvimento"),
    CO_STUDENT("Co-autor", "Estudante com participação significativa"),
    
    PRIMARY_ADVISOR("Orientador Principal", "Orientador responsável principal"),
    SECONDARY_ADVISOR("Orientador Colaborador", "Orientador auxiliar"),
    CO_ADVISOR("Co-orientador", "Co-orientador oficial"),
    EXTERNAL_ADVISOR("Orientador Externo", "Orientador de outra instituição"),
    
    EXAMINER("Banca Examinadora", "Membro da banca examinadora"),
    REVIEWER("Revisor", "Revisor convidado"),
    OBSERVER("Observador", "Acesso apenas para leitura");
    
    private final String displayName;
    private final String description;
    
    CollaboratorRole(String displayName, String description) {
        this.displayName = displayName;
        this.description = description;
    }
    
    public String getDisplayName() { return displayName; }
    public String getDescription() { return description; }
    
    public boolean isStudent() {
        return this == PRIMARY_STUDENT || this == SECONDARY_STUDENT || this == CO_STUDENT;
    }
    
    public boolean isAdvisor() {
        return this == PRIMARY_ADVISOR || this == SECONDARY_ADVISOR || 
               this == CO_ADVISOR || this == EXTERNAL_ADVISOR;
    }
    
    public boolean isPrimary() {
        return this == PRIMARY_STUDENT || this == PRIMARY_ADVISOR;
    }
    
    public boolean canEdit() {
        return this != EXAMINER && this != OBSERVER && this != REVIEWER;
    }
    
    public boolean canManageCollaborators() {
        return this == PRIMARY_STUDENT || this == PRIMARY_ADVISOR;
    }
    
    public boolean canSubmitDocument() {
        return isStudent() && this != OBSERVER;
    }
    
    public boolean canApproveDocument() {
        return isAdvisor();
    }
}