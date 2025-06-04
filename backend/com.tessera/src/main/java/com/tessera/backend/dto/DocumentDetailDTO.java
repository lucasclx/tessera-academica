package com.tessera.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class DocumentDetailDTO extends DocumentDTO {
    
    private List<DocumentCollaboratorDTO> collaborators;
    private List<UserSelectionDTO> students;
    private List<UserSelectionDTO> advisors;
    private boolean canEdit;
    private boolean canManageCollaborators;
    private boolean canSubmitDocument;
    private boolean canApproveDocument;
    private boolean canAddMoreStudents;
    private boolean canAddMoreAdvisors;
    private int activeStudentCount;
    private int activeAdvisorCount;
    private int maxStudents;
    private int maxAdvisors;
    private boolean allowMultipleStudents;
    private boolean allowMultipleAdvisors;
    
    // Campos específicos para colaboração
    private String primaryStudentName;
    private String primaryAdvisorName;
    private String allStudentNames;
    private String allAdvisorNames;
    
    // Construtor a partir de DocumentDTO
    public DocumentDetailDTO(DocumentDTO documentDTO) {
        super(documentDTO.getId(), documentDTO.getTitle(), documentDTO.getDescription(),
              documentDTO.getStatus(),
              documentDTO.getCreatedAt(), documentDTO.getUpdatedAt(),
              documentDTO.getSubmittedAt(), documentDTO.getApprovedAt(),
              documentDTO.getRejectedAt(), documentDTO.getRejectionReason(),
              documentDTO.getVersionCount());
    }
}