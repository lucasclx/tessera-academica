package com.tessera.backend.service;

import com.tessera.backend.entity.Document;
import com.tessera.backend.entity.User;
import com.tessera.backend.repository.DocumentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class AuthorizationService {
    
    @Autowired
    private DocumentRepository documentRepository;
    
    /**
     * Verifica se o usuário tem acesso a um documento
     */
    public boolean hasDocumentAccess(User user, Long documentId) {
        Document document = documentRepository.findById(documentId).orElse(null);
        if (document == null) {
            return false;
        }
        
        // Admin sempre tem acesso
        if (user.getRoles().stream().anyMatch(r -> r.getName().equals("ADMIN"))) {
            return true;
        }
        
        // Verificar se é colaborador ativo
        return document.hasCollaborator(user);
    }
    
    /**
     * Verifica se o usuário pode editar um documento
     */
    public boolean canEditDocument(User user, Long documentId) {
        Document document = documentRepository.findById(documentId).orElse(null);
        if (document == null) {
            return false;
        }
        
        // Admin sempre pode editar
        if (user.getRoles().stream().anyMatch(r -> r.getName().equals("ADMIN"))) {
            return true;
        }
        
        return document.canUserEdit(user);
    }
    
    /**
     * Verifica se o usuário pode gerenciar colaboradores
     */
    public boolean canManageCollaborators(User user, Long documentId) {
        Document document = documentRepository.findById(documentId).orElse(null);
        if (document == null) {
            return false;
        }
        
        // Admin sempre pode gerenciar
        if (user.getRoles().stream().anyMatch(r -> r.getName().equals("ADMIN"))) {
            return true;
        }
        
        return document.canUserManageCollaborators(user);
    }
    
    /**
     * Verifica se o usuário pode alterar o status do documento
     */
    public boolean canChangeDocumentStatus(User user, Long documentId) {
        Document document = documentRepository.findById(documentId).orElse(null);
        if (document == null) {
            return false;
        }
        
        // Admin sempre pode alterar status
        if (user.getRoles().stream().anyMatch(r -> r.getName().equals("ADMIN"))) {
            return true;
        }
        
        return document.canUserSubmitDocument(user) || document.canUserApproveDocument(user);
    }
}