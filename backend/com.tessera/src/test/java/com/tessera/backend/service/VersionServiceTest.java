package com.tessera.backend.service;

import com.tessera.backend.dto.VersionDTO;
import com.tessera.backend.entity.*;
import com.tessera.backend.repository.DocumentRepository;
import com.tessera.backend.repository.VersionRepository;
import com.tessera.backend.util.DiffUtils;
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
class VersionServiceTest {

    @InjectMocks
    private VersionService service;

    @Mock
    private VersionRepository versionRepository;
    @Mock
    private DocumentRepository documentRepository;
    @Mock
    private DiffUtils diffUtils;
    @Mock
    private NotificationEventService notificationEventService;

    private Document document;
    private User coauthor;

    @BeforeEach
    void setup() {
        coauthor = createUser(2L, "Coauthor", "co@test.com", "STUDENT");

        document = new Document();
        document.setId(100L);
        document.setStatus(DocumentStatus.DRAFT);

        DocumentCollaborator collab = new DocumentCollaborator();
        collab.setId(10L);
        collab.setDocument(document);
        collab.setUser(coauthor);
        collab.setRole(CollaboratorRole.CO_STUDENT);
        collab.setPermission(CollaboratorPermission.READ_WRITE);

        document.setCollaborators(new ArrayList<>(List.of(collab)));
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
    void testCreateVersionByCoauthor() {
        VersionDTO dto = new VersionDTO();
        dto.setDocumentId(document.getId());
        dto.setCommitMessage("init");
        dto.setContent("content");

        when(documentRepository.findById(document.getId())).thenReturn(Optional.of(document));
        when(versionRepository.findByDocumentOrderByCreatedAtDesc(document)).thenReturn(Collections.emptyList());
        when(versionRepository.findLatestByDocument(document)).thenReturn(Optional.empty());
        when(versionRepository.save(any())).thenAnswer(inv -> {
            Version v = inv.getArgument(0);
            v.setId(1L);
            return v;
        });

        VersionDTO result = service.createVersion(dto, coauthor);

        assertEquals(1L, result.getId());
        assertEquals("1.0", result.getVersionNumber());
        assertEquals(coauthor.getId(), result.getCreatedById());
        verify(versionRepository).save(any(Version.class));
        verify(notificationEventService).onVersionCreated(any(Version.class), eq(coauthor));
    }

    @Test
    void testUpdateVersionByCoauthor() {
        Version version = new Version();
        version.setId(1L);
        version.setDocument(document);
        version.setVersionNumber("1.0");
        version.setCommitMessage("old");
        version.setContent("old");
        version.setCreatedBy(coauthor);

        VersionDTO dto = new VersionDTO();
        dto.setCommitMessage("new msg");
        dto.setContent("new content");

        when(versionRepository.findById(1L)).thenReturn(Optional.of(version));
        when(versionRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(diffUtils.generateDiff("old", "new content")).thenReturn("diff");

        VersionDTO result = service.updateVersion(1L, dto, coauthor);

        assertEquals("new msg", result.getCommitMessage());
        assertEquals("new content", result.getContent());
        assertEquals("diff", result.getDiffFromPrevious());
        verify(versionRepository).save(version);
    }
}
