package com.tessera.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DocumentCollaboratorListDTO {
    private Long documentId;
    private String documentTitle;
    private List<DocumentCollaboratorDTO> collaborators;
    private CollaboratorStatsDTO stats;
    private boolean canManageCollaborators;
    private boolean allowInvitations;
}