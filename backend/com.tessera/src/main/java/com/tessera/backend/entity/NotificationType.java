package com.tessera.backend.entity;

public enum NotificationType {
    // Documentos
    DOCUMENT_CREATED("Documento criado", "📄"),
    DOCUMENT_SUBMITTED("Documento submetido", "📤"),
    DOCUMENT_APPROVED("Documento aprovado", "✅"),
    DOCUMENT_REJECTED("Documento rejeitado", "❌"),
    DOCUMENT_REVISION_REQUESTED("Revisão solicitada", "🔄"),
    DOCUMENT_FINALIZED("Documento finalizado", "🎯"),
    
    // Versões
    VERSION_CREATED("Nova versão criada", "📝"),
    VERSION_UPDATED("Versão atualizada", "✏️"),
    
    // Comentários
    COMMENT_ADDED("Novo comentário", "💬"),
    COMMENT_REPLIED("Resposta ao comentário", "↩️"),
    COMMENT_RESOLVED("Comentário resolvido", "✔️"),
    
    // Sistema
    USER_REGISTERED("Novo usuário registrado", "👤"),
    USER_APPROVED("Usuário aprovado", "✅"),
    USER_REJECTED("Usuário rejeitado", "❌"),
    
    // Lembretes
    DEADLINE_APPROACHING("Prazo se aproximando", "⏰"),
    DEADLINE_OVERDUE("Prazo vencido", "🚨"),
    TASK_ASSIGNED("Tarefa atribuída", "📋");
    
    private final String defaultTitle;
    private final String icon;
    
    NotificationType(String defaultTitle, String icon) {
        this.defaultTitle = defaultTitle;
        this.icon = icon;
    }
    
    public String getDefaultTitle() {
        return defaultTitle;
    }
    
    public String getIcon() {
        return icon;
    }
}