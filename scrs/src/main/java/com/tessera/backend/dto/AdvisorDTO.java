package com.tessera.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AdvisorDTO {
    private Long id;
    private String name;
    // Poderia adicionar email ou departamento se necessário para a seleção no frontend
}