package com.tessera.backend.service;

import com.tessera.backend.entity.Document; // e outras entidades necessárias
import com.tessera.backend.entity.User;
import com.tessera.backend.entity.DocumentCollaborator;
import com.tessera.backend.entity.CollaboratorRole;
import com.tessera.backend.repository.DocumentRepository;
import com.tessera.backend.repository.DocumentCollaboratorRepository;
import com.tessera.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

@Service("authorizationService") // O nome "authorizationService" é o padrão, mas pode ser explícito.
public class AuthorizationService {

    @Autowired
    private DocumentRepository documentRepository; // Exemplo de dependência

    @Autowired
    private DocumentCollaboratorRepository collaboratorRepository;

    @Autowired
    private UserRepository userRepository;

    public boolean hasDocumentAccess(Authentication authentication, Long documentId) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return false;
        }

        User user = userRepository.findByEmail(authentication.getName()).orElse(null);
        if (user == null) {
            return false;
        }

        Document document = documentRepository.findById(documentId).orElse(null);
        if (document == null) {
            return false;
        }

        return collaboratorRepository
                .existsByDocumentAndUserAndActiveTrue(document, user);
    }

    // Implemente outros métodos como canEditDocument, canChangeDocumentStatus, etc.
    public boolean canEditDocument(Authentication authentication, Long documentId) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return false;
        }

        User user = userRepository.findByEmail(authentication.getName()).orElse(null);
        if (user == null) {
            return false;
        }

        Document document = documentRepository.findById(documentId).orElse(null);
        if (document == null) {
            return false;
        }

        return collaboratorRepository.findByDocumentAndUserAndActiveTrue(document, user)
                .map(c -> c.getPermission().canWrite() && c.getRole().canEdit())
                .orElse(false);
    }

    public boolean canChangeDocumentStatus(Authentication authentication, Long documentId) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return false;
        }

        User user = userRepository.findByEmail(authentication.getName()).orElse(null);
        if (user == null) {
            return false;
        }

        Document document = documentRepository.findById(documentId).orElse(null);
        if (document == null) {
            return false;
        }

        return collaboratorRepository.findByDocumentAndUserAndActiveTrue(document, user)
                .map(c -> c.getPermission().canManageCollaborators()
                        || c.getRole().canManageCollaborators()
                        || c.getRole().canSubmitDocument()
                        || c.getRole().canApproveDocument())
                .orElse(false);
    }
    public boolean canDeleteDocument(Authentication authentication, Long documentId) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return false;
        }

        User user = userRepository.findByEmail(authentication.getName()).orElse(null);
        if (user == null) {
            return false;
        }

        Document document = documentRepository.findById(documentId).orElse(null);
        if (document == null) {
            return false;
        }

        return collaboratorRepository.findByDocumentAndUserAndActiveTrue(document, user)
                .map(c -> c.getRole() == CollaboratorRole.PRIMARY_STUDENT)
                .orElse(false);
    }
}