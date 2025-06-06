package com.tessera.backend.entity;

public enum DocumentStatus {
    DRAFT,         // Rascunho - ainda em edição pelo aluno
    SUBMITTED,     // Submetido para avaliação do orientador
    REVISION,      // Em revisão - orientador solicitou alterações
    REJECTED,      // Rejeitado de forma definitiva pelo orientador
    APPROVED,      // Aprovado pelo orientador
    FINALIZED      // Finalizado - pronto para apresentação/publicação
}