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
}