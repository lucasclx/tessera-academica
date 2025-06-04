package com.tessera.backend.service;

import com.tessera.backend.dto.DocumentDTO;
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
class DocumentServiceTest {

    @InjectMocks
    private DocumentService service;

    @Mock
    private DocumentRepository documentRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private DocumentCollaboratorRepository collaboratorRepository;
    @Mock
    private NotificationEventService notificationEventService;

    private User student;
    private User advisor;

    @BeforeEach
    void setup() {
        student = createUser(1L, "Student", "student@test.com", "STUDENT");
        advisor = createUser(2L, "Advisor", "advisor@test.com", "ADVISOR");
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
    void testCreateDocumentAddsPrimaryCollaboratorsToDocument() {
        DocumentDTO dto = new DocumentDTO();
        dto.setTitle("Doc");
        dto.setDescription("desc");
        dto.setStudentId(student.getId());
        dto.setAdvisorId(advisor.getId());

        when(userRepository.findById(student.getId())).thenReturn(Optional.of(student));
        when(userRepository.findById(advisor.getId())).thenReturn(Optional.of(advisor));
        when(collaboratorRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(documentRepository.save(any(Document.class))).thenAnswer(inv -> inv.getArgument(0));

        ArgumentCaptor<Document> captor = ArgumentCaptor.forClass(Document.class);

        service.createDocument(dto, student);

        verify(documentRepository, times(2)).save(captor.capture());
        Document finalDoc = captor.getAllValues().get(1);
        assertEquals(2, finalDoc.getCollaborators().size());
        assertTrue(finalDoc.getCollaborators().stream()
                .anyMatch(c -> c.getUser() == student && c.getRole() == CollaboratorRole.PRIMARY_STUDENT));
        assertTrue(finalDoc.getCollaborators().stream()
                .anyMatch(c -> c.getUser() == advisor && c.getRole() == CollaboratorRole.PRIMARY_ADVISOR));
    }
}
