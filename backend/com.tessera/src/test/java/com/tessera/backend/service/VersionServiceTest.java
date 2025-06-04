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

    private User student;
    private Document document;

    @BeforeEach
    void setup() {
        student = createUser(1L, "Student", "s@test.com", "STUDENT");
        document = new Document();
        document.setId(100L);
        document.setStatus(DocumentStatus.DRAFT);
        document.setStudent(student);
    }

    private User createUser(Long id, String name, String email, String roleName) {
        User u = new User();
        u.setId(id);
        u.setName(name);
        u.setEmail(email);
        Role r = new Role(roleName);
        u.setRoles(new HashSet<>(Set.of(r)));
        return u;
    }

    @Test
    void testCreateVersionSuccess() {
        VersionDTO dto = new VersionDTO();
        dto.setDocumentId(document.getId());
        dto.setContent("data");
        dto.setCommitMessage("msg");

        when(documentRepository.findById(document.getId())).thenReturn(Optional.of(document));
        when(versionRepository.findByDocumentOrderByCreatedAtDesc(document)).thenReturn(Collections.emptyList());
        when(versionRepository.findLatestByDocument(document)).thenReturn(Optional.empty());
        when(versionRepository.save(any())).thenAnswer(inv -> {
            Version v = inv.getArgument(0);
            v.setId(5L);
            return v;
        });

        VersionDTO result = service.createVersion(dto, student);

        assertEquals("1.0", result.getVersionNumber());
        verify(versionRepository).save(any(Version.class));
        verify(notificationEventService).onVersionCreated(any(Version.class), eq(student));
        verify(documentRepository, never()).save(any());
    }

    @Test
    void testCreateVersionUnauthorized() {
        User other = createUser(2L, "Other", "o@test.com", "STUDENT");
        VersionDTO dto = new VersionDTO();
        dto.setDocumentId(document.getId());
        dto.setContent("c");

        when(documentRepository.findById(document.getId())).thenReturn(Optional.of(document));

        assertThrows(RuntimeException.class, () -> service.createVersion(dto, other));
        verify(versionRepository, never()).save(any());
    }

    @Test
    void testCreateVersionInvalidStatus() {
        document.setStatus(DocumentStatus.APPROVED);
        VersionDTO dto = new VersionDTO();
        dto.setDocumentId(document.getId());
        dto.setContent("c");

        when(documentRepository.findById(document.getId())).thenReturn(Optional.of(document));

        assertThrows(RuntimeException.class, () -> service.createVersion(dto, student));
        verify(versionRepository, never()).save(any());
    }

    @Test
    void testCreateVersionFromRevision() {
        document.setStatus(DocumentStatus.REVISION);
        Version prev = new Version();
        prev.setVersionNumber("1.0");
        prev.setContent("old");

        VersionDTO dto = new VersionDTO();
        dto.setDocumentId(document.getId());
        dto.setContent("new");
        dto.setCommitMessage("msg");

        when(documentRepository.findById(document.getId())).thenReturn(Optional.of(document));
        when(versionRepository.findByDocumentOrderByCreatedAtDesc(document)).thenReturn(List.of(prev));
        when(versionRepository.findLatestByDocument(document)).thenReturn(Optional.of(prev));
        when(diffUtils.generateDiff("old", "new")).thenReturn("diff");
        when(versionRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(documentRepository.save(document)).thenReturn(document);

        VersionDTO result = service.createVersion(dto, student);

        assertEquals("1.1", result.getVersionNumber());
        assertEquals("diff", result.getDiffFromPrevious());
        assertEquals(DocumentStatus.SUBMITTED, document.getStatus());
        verify(documentRepository).save(document);
    }
}
