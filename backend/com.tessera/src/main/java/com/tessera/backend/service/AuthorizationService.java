package com.tessera.backend.service;

import com.tessera.backend.entity.Document;
import com.tessera.backend.entity.User;
import com.tessera.backend.repository.DocumentCollaboratorRepository;
import com.tessera.backend.repository.DocumentRepository;
import com.tessera.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service("authorizationService")
@Transactional(readOnly = true)
public class AuthorizationService {

    @Autowired
    private DocumentRepository documentRepository;

    @Autowired
    private DocumentCollaboratorRepository collaboratorRepository;

    @Autowired
    private UserRepository userRepository;

    private User getUser(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return null;
        }
        return userRepository.findByEmail(authentication.getName()).orElse(null);
    }

    public boolean hasDocumentAccess(Authentication authentication, Long documentId) {
        User user = getUser(authentication);
        if (user == null) return false;

        return collaboratorRepository.existsByDocumentIdAndUserIdAndActiveTrue(documentId, user.getId());
    }

    public boolean canEditDocument(Authentication authentication, Long documentId) {
        User user = getUser(authentication);
        if (user == null) return false;

        return collaboratorRepository.existsWithWritePermission(documentId, user.getId());
    }

    public boolean canChangeDocumentStatus(Authentication authentication, Long documentId) {
        User user = getUser(authentication);
        if (user == null) return false;

        return collaboratorRepository.existsWithStatusChangePermission(documentId, user.getId());
    }

    public boolean canDeleteDocument(Authentication authentication, Long documentId) {
        User user = getUser(authentication);
        if (user == null) return false;
        
        // Apenas Admins ou Estudantes Principais podem deletar.
        if(user.getRoles().stream().anyMatch(r -> r.getName().equals("ADMIN"))) {
            return true;
        }

        return collaboratorRepository.isPrimaryStudent(documentId, user.getId());
    }
}