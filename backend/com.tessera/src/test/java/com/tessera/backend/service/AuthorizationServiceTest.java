package com.tessera.backend.service;

import com.tessera.backend.entity.*;
import com.tessera.backend.repository.DocumentCollaboratorRepository;
import com.tessera.backend.repository.DocumentRepository;
import com.tessera.backend.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.Authentication;

import java.util.Optional;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthorizationServiceTest {

    @InjectMocks
    private AuthorizationService service;

    @Mock
    private DocumentRepository documentRepository;
    @Mock
    private DocumentCollaboratorRepository collaboratorRepository;
    @Mock
    private UserRepository userRepository;

    private Document document;
    private User user;
    private Authentication auth;

    @BeforeEach
    void setup() {
        document = new Document();
        document.setId(1L);

        user = new User();
        user.setId(10L);
        user.setEmail("user@test.com");
        user.setName("User");
        user.setRoles(Set.of(new Role("STUDENT")));

        auth = mock(Authentication.class);
        when(auth.isAuthenticated()).thenReturn(true);
        when(auth.getName()).thenReturn(user.getEmail());
    }

    @Test
    void testHasDocumentAccessNoCollaborator() {
        when(userRepository.findByEmail(user.getEmail())).thenReturn(Optional.of(user));
        when(documentRepository.findById(document.getId())).thenReturn(Optional.of(document));
        when(collaboratorRepository.existsByDocumentAndUserAndActiveTrue(document, user)).thenReturn(false);

        assertFalse(service.hasDocumentAccess(auth, document.getId()));
    }

    @Test
    void testCanEditDocumentWithoutPermission() {
        DocumentCollaborator collab = new DocumentCollaborator();
        collab.setDocument(document);
        collab.setUser(user);
        collab.setRole(CollaboratorRole.SECONDARY_STUDENT);
        collab.setPermission(CollaboratorPermission.READ_ONLY);

        when(userRepository.findByEmail(user.getEmail())).thenReturn(Optional.of(user));
        when(documentRepository.findById(document.getId())).thenReturn(Optional.of(document));
        when(collaboratorRepository.findByDocumentAndUserAndActiveTrue(document, user))
                .thenReturn(Optional.of(collab));

        assertFalse(service.canEditDocument(auth, document.getId()));
    }

    @Test
    void testCanChangeStatusWithoutPermission() {
        DocumentCollaborator collab = new DocumentCollaborator();
        collab.setDocument(document);
        collab.setUser(user);
        collab.setRole(CollaboratorRole.OBSERVER);
        collab.setPermission(CollaboratorPermission.READ_ONLY);

        when(userRepository.findByEmail(user.getEmail())).thenReturn(Optional.of(user));
        when(documentRepository.findById(document.getId())).thenReturn(Optional.of(document));
        when(collaboratorRepository.findByDocumentAndUserAndActiveTrue(document, user))
                .thenReturn(Optional.of(collab));

        assertFalse(service.canChangeDocumentStatus(auth, document.getId()));
    }

    @Test
    void testCanDeleteDocumentNotPrimaryStudent() {
        DocumentCollaborator collab = new DocumentCollaborator();
        collab.setDocument(document);
        collab.setUser(user);
        collab.setRole(CollaboratorRole.SECONDARY_STUDENT);
        collab.setPermission(CollaboratorPermission.READ_WRITE);

        when(userRepository.findByEmail(user.getEmail())).thenReturn(Optional.of(user));
        when(documentRepository.findById(document.getId())).thenReturn(Optional.of(document));
        when(collaboratorRepository.findByDocumentAndUserAndActiveTrue(document, user))
                .thenReturn(Optional.of(collab));

        assertFalse(service.canDeleteDocument(auth, document.getId()));
    }
}

