package com.tessera.backend.service;

import com.tessera.backend.dto.AddCollaboratorRequestDTO;
import com.tessera.backend.dto.DocumentCollaboratorDTO;
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

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DocumentCollaboratorServiceTest {

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
    @Mock
    private AuthorizationService authorizationService;

    private User manager;
    private Document document;

    @BeforeEach
    void setup() {
        manager = createUser(1L, "Manager", "manager@test.com", "ADVISOR");
        document = new Document();
        document.setId(100L);

        DocumentCollaborator managerCollab = new DocumentCollaborator();
        managerCollab.setId(10L);
        managerCollab.setDocument(document);
        managerCollab.setUser(manager);
        managerCollab.setRole(CollaboratorRole.PRIMARY_ADVISOR);
        managerCollab.setPermission(CollaboratorPermission.FULL_ACCESS);

        document.setCollaborators(new ArrayList<>(List.of(managerCollab)));
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

    @Test
    void testAddCollaboratorSuccess() {
        User newUser = createUser(2L, "Student", "student@test.com", "STUDENT");
        AddCollaboratorRequestDTO req = new AddCollaboratorRequestDTO(
                newUser.getEmail(),
                CollaboratorRole.SECONDARY_STUDENT,
                CollaboratorPermission.READ_WRITE,
                null
        );

        when(documentRepository.findById(100L)).thenReturn(Optional.of(document));
        when(userRepository.findByEmail(newUser.getEmail())).thenReturn(Optional.of(newUser));
        when(collaboratorRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        DocumentCollaboratorDTO dto = service.addCollaborator(100L, req, manager);

        assertEquals(newUser.getId(), dto.getUserId());
        assertEquals(CollaboratorRole.SECONDARY_STUDENT, dto.getRole());
        verify(notificationEventService).onCollaboratorAdded(document, newUser, manager, CollaboratorRole.SECONDARY_STUDENT);
        verify(collaboratorRepository).save(any(DocumentCollaborator.class));
    }

    @Test
    void testUpdateCollaboratorPermissionsWithoutPermission() {
        User collaboratorUser = createUser(3L, "Student2", "st2@test.com", "STUDENT");

        DocumentCollaborator collaborator = new DocumentCollaborator();
        collaborator.setId(20L);
        collaborator.setDocument(document);
        collaborator.setUser(collaboratorUser);
        collaborator.setRole(CollaboratorRole.SECONDARY_STUDENT);
        collaborator.setPermission(CollaboratorPermission.READ_WRITE);

        DocumentCollaborator currentCollab = document.getCollaborators().get(0);
        currentCollab.setPermission(CollaboratorPermission.READ_WRITE);
        currentCollab.setRole(CollaboratorRole.SECONDARY_STUDENT);

        document.getCollaborators().add(collaborator);

        when(collaboratorRepository.findById(20L)).thenReturn(Optional.of(collaborator));

        assertThrows(RuntimeException.class, () ->
                service.updateCollaboratorPermissions(20L, CollaboratorPermission.READ_ONLY, manager));
    }

    @Test
    void testPromoteToPrimaryStudent() {
        User student = createUser(4L, "Student3", "st3@test.com", "STUDENT");
        User primary = createUser(5L, "Primary", "primary@test.com", "STUDENT");

        DocumentCollaborator collabToPromote = new DocumentCollaborator();
        collabToPromote.setId(30L);
        collabToPromote.setDocument(document);
        collabToPromote.setUser(student);
        collabToPromote.setRole(CollaboratorRole.SECONDARY_STUDENT);
        collabToPromote.setPermission(CollaboratorPermission.READ_WRITE);

        DocumentCollaborator primaryCollab = new DocumentCollaborator();
        primaryCollab.setId(40L);
        primaryCollab.setDocument(document);
        primaryCollab.setUser(primary);
        primaryCollab.setRole(CollaboratorRole.PRIMARY_STUDENT);
        primaryCollab.setPermission(CollaboratorPermission.FULL_ACCESS);

        document.getCollaborators().add(collabToPromote);
        document.getCollaborators().add(primaryCollab);

        when(collaboratorRepository.findById(30L)).thenReturn(Optional.of(collabToPromote));
        when(collaboratorRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        DocumentCollaboratorDTO dto = service.promoteToPrimary(30L, manager);

        assertEquals(CollaboratorRole.PRIMARY_STUDENT, collabToPromote.getRole());
        assertEquals(CollaboratorPermission.FULL_ACCESS, collabToPromote.getPermission());
        assertEquals(CollaboratorRole.SECONDARY_STUDENT, primaryCollab.getRole());
        verify(collaboratorRepository, times(2)).save(any(DocumentCollaborator.class));
        assertEquals(CollaboratorRole.PRIMARY_STUDENT, dto.getRole());
        assertEquals(student.getId(), dto.getUserId());
    }

    @Test
    void testReAddInactiveCollaborator() {
        User user = createUser(6L, "Old", "old@test.com", "STUDENT");
        DocumentCollaborator inactive = new DocumentCollaborator();
        inactive.setId(50L);
        inactive.setDocument(document);
        inactive.setUser(user);
        inactive.setRole(CollaboratorRole.SECONDARY_STUDENT);
        inactive.setPermission(CollaboratorPermission.READ_WRITE);
        inactive.setActive(false);

        document.getCollaborators().add(inactive);

        AddCollaboratorRequestDTO req = new AddCollaboratorRequestDTO(
                user.getEmail(),
                CollaboratorRole.CO_STUDENT,
                CollaboratorPermission.READ_WRITE,
                null
        );

        when(documentRepository.findById(100L)).thenReturn(Optional.of(document));
        when(userRepository.findByEmail(user.getEmail())).thenReturn(Optional.of(user));
        when(collaboratorRepository.findByDocumentAndUser(document, user)).thenReturn(Optional.of(inactive));
        when(collaboratorRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        DocumentCollaboratorDTO dto = service.addCollaborator(100L, req, manager);

        assertTrue(inactive.isActive());
        assertEquals(CollaboratorRole.CO_STUDENT, inactive.getRole());
        verify(collaboratorRepository).save(inactive);
        assertEquals(inactive.getId(), dto.getId());
    }
}
