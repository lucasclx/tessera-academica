package com.tessera.backend.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RegistrationRejectionDTO {
    
    @NotBlank(message = "Motivo da rejeição não pode ser vazio")
    private String rejectionReason;
}