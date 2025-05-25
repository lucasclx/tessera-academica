package com.tessera.backend.dto;

import com.tessera.backend.entity.CollaboratorRole;
import com.tessera.backend.entity.CollaboratorPermission;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotNull;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AddCollaboratorRequestDTO {
    
    @NotNull(message = "Email do usuário é obrigatório")
    @Email(message = "Email deve ser válido")
    private String userEmail;
    
    @NotNull(message = "Papel do colaborador é obrigatório")
    private CollaboratorRole role;
    
    @NotNull(message = "Permissão é obrigatória")
    private CollaboratorPermission permission;
    
    private String message; // Mensagem opcional para convite
}
