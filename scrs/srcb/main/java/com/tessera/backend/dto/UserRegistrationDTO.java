package com.tessera.backend.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserRegistrationDTO {
    
    @NotBlank(message = "Nome não pode ser vazio")
    private String name;
    
    @NotBlank(message = "Email não pode ser vazio")
    @Email(message = "Email deve ser válido")
    private String email;
    
    @NotBlank(message = "Senha não pode ser vazia")
    @Size(min = 6, message = "Senha deve ter pelo menos 6 caracteres")
    private String password;
    
    @NotBlank(message = "Nome da role não pode ser vazio")
    private String role;
    
    @NotBlank(message = "Instituição não pode ser vazia")
    private String institution;
    
    @NotBlank(message = "Departamento não pode ser vazio")
    private String department;
    
    @NotBlank(message = "Justificativa não pode ser vazia")
    private String justification;
}