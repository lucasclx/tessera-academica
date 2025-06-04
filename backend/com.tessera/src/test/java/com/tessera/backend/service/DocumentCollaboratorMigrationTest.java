package com.tessera.backend.service;

import com.tessera.backend.entity.*;
import com.tessera.backend.repository.DocumentCollaboratorRepository;
import com.tessera.backend.repository.DocumentRepository;
import com.tessera.backend.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DocumentCollaboratorMigrationTest {

    @InjectMocks
    private DocumentCollaboratorService service;

    @Mock
    private DocumentCollaboratorRepository collaboratorRepository;
    @Mock
    private DocumentRepository documentRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private NotificationEventService notificationEventService;

    private User student10;
    private User advisor20;
    private User advisor21;
    private User advisor22;

    private Document doc1;
    private Document doc2;
    private Document doc3;
    private Document doc4;

    @BeforeEach
    void setup() {
        student10 = createUser(10L, "Student10", "s10@test.com", "STUDENT");
        advisor20 = createUser(20L, "Advisor20", "a20@test.com", "ADVISOR");
        advisor21 = createUser(21L, "Advisor21", "a21@test.com", "ADVISOR");
        advisor22 = createUser(22L, "Advisor22", "a22@test.com", "ADVISOR");

        doc1 = new Document();
        doc1.setId(1L);
        doc1.setCollaborators(new ArrayList<>());

        doc2 = new Document();
        doc2.setId(2L);
        doc2.setCollaborators(new ArrayList<>());

        doc3 = new Document();
        doc3.setId(3L);
        DocumentCollaborator existingStudent = new DocumentCollaborator();
        existingStudent.setDocument(doc3);
        existingStudent.setUser(createUser(30L, "Student30", "s30@test.com", "STUDENT"));
        existingStudent.setRole(CollaboratorRole.PRIMARY_STUDENT);
        existingStudent.setPermission(CollaboratorPermission.FULL_ACCESS);
        doc3.setCollaborators(new ArrayList<>(List.of(existingStudent)));

        doc4 = new Document();
        doc4.setId(4L);
        DocumentCollaborator s41 = new DocumentCollaborator();
        s41.setDocument(doc4);
        s41.setUser(createUser(41L, "Student41", "s41@test.com", "STUDENT"));
        s41.setRole(CollaboratorRole.PRIMARY_STUDENT);
        s41.setPermission(CollaboratorPermission.FULL_ACCESS);
        DocumentCollaborator a42 = new DocumentCollaborator();
        a42.setDocument(doc4);
        a42.setUser(createUser(42L, "Advisor42", "a42@test.com", "ADVISOR"));
        a42.setRole(CollaboratorRole.PRIMARY_ADVISOR);
        a42.setPermission(CollaboratorPermission.FULL_ACCESS);
        doc4.setCollaborators(new ArrayList<>(List.of(s41, a42)));
    }

    private User createUser(Long id, String name, String email, String roleName) {
        User u = new User();
        u.setId(id);
        u.setName(name);
        u.setEmail(email);
        Role role = new Role(roleName);
        u.setRoles(new HashSet<>(Set.of(role)));
        return u;
    }

    @Test
    void testMigrationPopulatesPrimaryCollaborators() {
        List<Object[]> rows = List.of(
                new Object[]{1L, 10L, 20L},
                new Object[]{2L, null, 21L},
                new Object[]{3L, 30L, 22L},
                new Object[]{4L, 41L, 42L}
        );

        when(documentRepository.findLegacyCollaboratorIds()).thenReturn(rows);
        when(documentRepository.findById(1L)).thenReturn(Optional.of(doc1));
        when(documentRepository.findById(2L)).thenReturn(Optional.of(doc2));
        when(documentRepository.findById(3L)).thenReturn(Optional.of(doc3));
        when(documentRepository.findById(4L)).thenReturn(Optional.of(doc4));

        when(userRepository.findById(10L)).thenReturn(Optional.of(student10));
        when(userRepository.findById(20L)).thenReturn(Optional.of(advisor20));
        when(userRepository.findById(21L)).thenReturn(Optional.of(advisor21));
        when(userRepository.findById(22L)).thenReturn(Optional.of(advisor22));

        when(collaboratorRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        service.migrateExistingDocuments();

        ArgumentCaptor<DocumentCollaborator> captor = ArgumentCaptor.forClass(DocumentCollaborator.class);
        verify(collaboratorRepository, times(4)).save(captor.capture());

        List<DocumentCollaborator> saved = captor.getAllValues();
        assertEquals(4, saved.size());

        assertTrue(saved.stream().anyMatch(c -> c.getDocument() == doc1 && c.getUser() == student10 && c.getRole() == CollaboratorRole.PRIMARY_STUDENT));
        assertTrue(saved.stream().anyMatch(c -> c.getDocument() == doc1 && c.getUser() == advisor20 && c.getRole() == CollaboratorRole.PRIMARY_ADVISOR));
        assertTrue(saved.stream().anyMatch(c -> c.getDocument() == doc2 && c.getUser() == advisor21 && c.getRole() == CollaboratorRole.PRIMARY_ADVISOR));
        assertTrue(saved.stream().anyMatch(c -> c.getDocument() == doc3 && c.getUser() == advisor22 && c.getRole() == CollaboratorRole.PRIMARY_ADVISOR));

        // doc3 already had a primary student and doc4 had both - ensure no duplicates
        assertFalse(saved.stream().anyMatch(c -> c.getDocument() == doc3 && c.getRole() == CollaboratorRole.PRIMARY_STUDENT));
        assertFalse(saved.stream().anyMatch(c -> c.getDocument() == doc4));
    }
}

