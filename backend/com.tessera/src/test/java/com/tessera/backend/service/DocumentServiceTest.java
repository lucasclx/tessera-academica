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

    @Test
    void testUpdateDocumentChangesTitleDescriptionAndAdvisor() {
        Document document = new Document();
        document.setId(10L);
        document.setTitle("Old");
        document.setDescription("OldDesc");
        document.setStatus(DocumentStatus.DRAFT);

        DocumentCollaborator studCollab = new DocumentCollaborator();
        studCollab.setId(1L);
        studCollab.setDocument(document);
        studCollab.setUser(student);
        studCollab.setRole(CollaboratorRole.PRIMARY_STUDENT);
        studCollab.setPermission(CollaboratorPermission.FULL_ACCESS);

        DocumentCollaborator oldAdvisorCollab = new DocumentCollaborator();
        oldAdvisorCollab.setId(2L);
        oldAdvisorCollab.setDocument(document);
        oldAdvisorCollab.setUser(advisor);
        oldAdvisorCollab.setRole(CollaboratorRole.PRIMARY_ADVISOR);
        oldAdvisorCollab.setPermission(CollaboratorPermission.FULL_ACCESS);

        document.setCollaborators(new ArrayList<>(List.of(studCollab, oldAdvisorCollab)));

        User newAdvisor = createUser(3L, "NewAdv", "new@test.com", "ADVISOR");

        DocumentDTO dto = new DocumentDTO();
        dto.setTitle("New");
        dto.setDescription("NewDesc");
        dto.setAdvisorId(newAdvisor.getId());

        when(documentRepository.findById(document.getId())).thenReturn(Optional.of(document));
        when(userRepository.findById(newAdvisor.getId())).thenReturn(Optional.of(newAdvisor));
        when(collaboratorRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(documentRepository.save(any(Document.class))).thenAnswer(inv -> inv.getArgument(0));

        DocumentDTO result = service.updateDocument(document.getId(), dto, student);

        assertEquals("New", result.getTitle());
        assertEquals("NewDesc", result.getDescription());
        verify(collaboratorRepository, times(2)).save(any(DocumentCollaborator.class));
        assertEquals(CollaboratorRole.SECONDARY_ADVISOR, oldAdvisorCollab.getRole());
    }

    @Test
    void testChangeStatusToSubmitted() {
        Document document = new Document();
        document.setId(20L);
        document.setStatus(DocumentStatus.DRAFT);

        DocumentCollaborator studCollab = new DocumentCollaborator();
        studCollab.setDocument(document);
        studCollab.setUser(student);
        studCollab.setRole(CollaboratorRole.PRIMARY_STUDENT);
        studCollab.setPermission(CollaboratorPermission.READ_WRITE);
        document.setCollaborators(new ArrayList<>(List.of(studCollab)));

        when(documentRepository.findById(document.getId())).thenReturn(Optional.of(document));
        when(documentRepository.save(any(Document.class))).thenAnswer(inv -> inv.getArgument(0));

        DocumentDTO dto = service.changeStatus(document.getId(), DocumentStatus.SUBMITTED, student, null);

        assertEquals(DocumentStatus.SUBMITTED, dto.getStatus());
        assertNotNull(document.getSubmittedAt());
        verify(notificationEventService).onDocumentStatusChanged(document, DocumentStatus.DRAFT, student);
    }

    @Test
    void testChangeStatusToRejected() {
        Document document = new Document();
        document.setId(25L);
        document.setStatus(DocumentStatus.SUBMITTED);

        DocumentCollaborator advCollab = new DocumentCollaborator();
        advCollab.setDocument(document);
        advCollab.setUser(advisor);
        advCollab.setRole(CollaboratorRole.PRIMARY_ADVISOR);
        advCollab.setPermission(CollaboratorPermission.FULL_ACCESS);
        document.setCollaborators(new ArrayList<>(List.of(advCollab)));

        when(documentRepository.findById(document.getId())).thenReturn(Optional.of(document));
        when(documentRepository.save(any(Document.class))).thenAnswer(inv -> inv.getArgument(0));

        String reason = "Plágio";
        DocumentDTO dto = service.changeStatus(document.getId(), DocumentStatus.REJECTED, advisor, reason);

        assertEquals(DocumentStatus.REJECTED, dto.getStatus());
        assertNotNull(document.getRejectedAt());
        assertEquals(reason, document.getRejectionReason());
        verify(notificationEventService).onDocumentStatusChanged(document, DocumentStatus.SUBMITTED, advisor);
    }

    @Test
    void testDeleteDocumentByPrimaryStudent() {
        Document document = new Document();
        document.setId(30L);
        document.setStatus(DocumentStatus.DRAFT);

        DocumentCollaborator studCollab = new DocumentCollaborator();
        studCollab.setDocument(document);
        studCollab.setUser(student);
        studCollab.setRole(CollaboratorRole.PRIMARY_STUDENT);
        studCollab.setPermission(CollaboratorPermission.FULL_ACCESS);
        document.setCollaborators(new ArrayList<>(List.of(studCollab)));

        when(documentRepository.findById(document.getId())).thenReturn(Optional.of(document));

        service.deleteDocument(document.getId(), student);

        verify(documentRepository).delete(document);
    }
}
