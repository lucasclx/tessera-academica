package com.tessera.backend.dto;

import com.tessera.backend.entity.CollaboratorRole;
import com.tessera.backend.entity.CollaboratorPermission;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import jakarta.validation.constraints.NotNull;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DocumentCollaboratorDTO {
    
    private Long id;
    
    @NotNull(message = "ID do documento é obrigatório")
    private Long documentId;
    
    @NotNull(message = "ID do usuário é obrigatório")
    private Long userId;
    
    private String userName;
    private String userEmail;
    
    @NotNull(message = "Papel do colaborador é obrigatório")
    private CollaboratorRole role;
    
    @NotNull(message = "Permissão é obrigatória")
    private CollaboratorPermission permission;
    
    private LocalDateTime addedAt;
    private String addedByName;
    private boolean active;
    private LocalDateTime lastAccessAt;
    
    // Campos calculados para facilitar o frontend
    private boolean canEdit;
    private boolean canComment;
    private boolean canManageCollaborators;
    private boolean canSubmitDocument;
    private boolean canApproveDocument;
    private boolean isPrimary;
    
    // Construtor auxiliar para cálculos de permissões
    public DocumentCollaboratorDTO(Long id, String userName, String userEmail, 
                                 CollaboratorRole role, CollaboratorPermission permission) {
        this.id = id;
        this.userName = userName;
        this.userEmail = userEmail;
        this.role = role;
        this.permission = permission;
        this.active = true;
        
        // Calcular permissões
        this.canEdit = permission.canWrite() && role.canEdit();
        this.canComment = permission.canComment();
        this.canManageCollaborators = permission.canManageCollaborators() || role.canManageCollaborators();
        this.canSubmitDocument = role.canSubmitDocument() && (permission.canWrite() || permission == CollaboratorPermission.FULL_ACCESS);
        this.canApproveDocument = role.canApproveDocument();
        this.isPrimary = role.isPrimary();
    }
    
    // Método para recalcular permissões após mudanças
    public void recalculatePermissions() {
        this.canEdit = permission.canWrite() && role.canEdit();
        this.canComment = permission.canComment();
        this.canManageCollaborators = permission.canManageCollaborators() || role.canManageCollaborators();
        this.canSubmitDocument = role.canSubmitDocument() && (permission.canWrite() || permission == CollaboratorPermission.FULL_ACCESS);
        this.canApproveDocument = role.canApproveDocument();
        this.isPrimary = role.isPrimary();
    }
}
