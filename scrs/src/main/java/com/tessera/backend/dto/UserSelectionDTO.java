package com.tessera.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserSelectionDTO {
    private Long id;
    private String name;
    private String email;
    private String role; // STUDENT, ADVISOR, etc.
    private String department; // Departamento (opcional)
    private String institution; // Instituição (opcional)
    private boolean isActive; // Se o usuário está ativo
    
    // Construtor simplificado para compatibilidade
    public UserSelectionDTO(Long id, String name) {
        this.id = id;
        this.name = name;
        this.isActive = true;
    }
    
    // Construtor com email
    public UserSelectionDTO(Long id, String name, String email) {
        this.id = id;
        this.name = name;
        this.email = email;
        this.isActive = true;
    }
}