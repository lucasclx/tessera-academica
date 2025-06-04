package com.tessera.backend.service;

import com.tessera.backend.dto.DocumentDTO;
import com.tessera.backend.entity.*;
import com.tessera.backend.exception.UnauthorizedOperationException;
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

import java.time.LocalDateTime;
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
        u.setPassword("pwd");
        Role role = new Role(roleName);
        u.setRoles(new HashSet<>(Set.of(role)));
        return u;
    }

    private Document createDraftDocument() {
        Document doc = new Document();
        doc.setId(10L);
        doc.setStatus(DocumentStatus.DRAFT);
        doc.setStudent(student);
        doc.setAdvisor(advisor);

        DocumentCollaborator collab = new DocumentCollaborator();
        collab.setDocument(doc);
        collab.setUser(student);
        collab.setRole(CollaboratorRole.PRIMARY_STUDENT);
        collab.setPermission(CollaboratorPermission.FULL_ACCESS);
        collab.setActive(true);
        doc.setCollaborators(new ArrayList<>(List.of(collab)));
        return doc;
    }

    @Test
    void testCreateDocumentSuccess() {
        DocumentDTO dto = new DocumentDTO();
        dto.setTitle("My Doc");
        dto.setDescription("Desc");
        dto.setStudentId(student.getId());
        dto.setAdvisorId(advisor.getId());

        when(userRepository.findById(student.getId())).thenReturn(Optional.of(student));
        when(userRepository.findById(advisor.getId())).thenReturn(Optional.of(advisor));
        when(documentRepository.save(any())).thenAnswer(inv -> {
            Document d = inv.getArgument(0);
            d.setId(5L);
            return d;
        });
        when(collaboratorRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        DocumentDTO result = service.createDocument(dto, student);

        assertEquals(5L, result.getId());
        verify(collaboratorRepository, times(2)).save(any(DocumentCollaborator.class));
        verify(notificationEventService).onDocumentCreated(any(Document.class), eq(student));
    }

    @Test
    void testCreateDocumentUnauthorized() {
        DocumentDTO dto = new DocumentDTO();
        dto.setTitle("My Doc");
        dto.setDescription("Desc");
        dto.setStudentId(student.getId());
        dto.setAdvisorId(advisor.getId());
        User other = createUser(3L, "Other", "o@test.com", "ADVISOR");

        when(userRepository.findById(student.getId())).thenReturn(Optional.of(student));
        when(userRepository.findById(advisor.getId())).thenReturn(Optional.of(advisor));

        assertThrows(UnauthorizedOperationException.class, () -> service.createDocument(dto, other));
        verify(documentRepository, never()).save(any());
    }

    @Test
    void testChangeStatusSubmitSuccess() {
        Document document = createDraftDocument();
        when(documentRepository.findById(document.getId())).thenReturn(Optional.of(document));
        when(documentRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        DocumentDTO dto = service.changeStatus(document.getId(), DocumentStatus.SUBMITTED, student, null);

        assertEquals(DocumentStatus.SUBMITTED, dto.getStatus());
        assertNotNull(document.getSubmittedAt());
        verify(notificationEventService).onDocumentStatusChanged(document, DocumentStatus.DRAFT, student);
        verify(documentRepository).save(document);
    }

    @Test
    void testChangeStatusUnauthorized() {
        Document document = createDraftDocument();
        when(documentRepository.findById(document.getId())).thenReturn(Optional.of(document));

        User stranger = createUser(4L, "Stranger", "s@test.com", "ADVISOR");
        assertThrows(UnauthorizedOperationException.class,
                () -> service.changeStatus(document.getId(), DocumentStatus.SUBMITTED, stranger, null));
        verify(documentRepository, never()).save(any());
    }

    @Test
    void testChangeStatusInvalidTransition() {
        Document document = createDraftDocument();
        document.setStatus(DocumentStatus.APPROVED);
        when(documentRepository.findById(document.getId())).thenReturn(Optional.of(document));

        assertThrows(IllegalStateException.class,
                () -> service.changeStatus(document.getId(), DocumentStatus.SUBMITTED, student, null));
        verify(documentRepository, never()).save(any());
    }

    @Test
    void testUpdateDocumentChangeAdvisor() {
        Document document = createDraftDocument();
        DocumentCollaborator primaryAdvisorCollab = new DocumentCollaborator();
        primaryAdvisorCollab.setDocument(document);
        primaryAdvisorCollab.setUser(advisor);
        primaryAdvisorCollab.setRole(CollaboratorRole.PRIMARY_ADVISOR);
        primaryAdvisorCollab.setPermission(CollaboratorPermission.FULL_ACCESS);
        primaryAdvisorCollab.setActive(true);
        document.getCollaborators().add(primaryAdvisorCollab);

        User newAdvisor = createUser(5L, "NewAdv", "n@test.com", "ADVISOR");
        DocumentDTO dto = new DocumentDTO();
        dto.setAdvisorId(newAdvisor.getId());

        when(documentRepository.findById(document.getId())).thenReturn(Optional.of(document));
        when(userRepository.findById(newAdvisor.getId())).thenReturn(Optional.of(newAdvisor));
        when(collaboratorRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(documentRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        DocumentDTO result = service.updateDocument(document.getId(), dto, student);

        assertEquals(newAdvisor.getId(), document.getAdvisor().getId());
        assertEquals(CollaboratorRole.SECONDARY_ADVISOR, primaryAdvisorCollab.getRole());
        verify(collaboratorRepository, times(2)).save(any(DocumentCollaborator.class));
        assertEquals(newAdvisor.getId(), result.getAdvisorId());
    }
}
