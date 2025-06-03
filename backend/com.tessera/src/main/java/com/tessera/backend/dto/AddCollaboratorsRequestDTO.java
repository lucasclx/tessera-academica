package com.tessera.backend.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AddCollaboratorsRequestDTO {

    @NotEmpty(message = "Lista de colaboradores é obrigatória")
    @Valid
    private List<AddCollaboratorRequestDTO> collaborators;
}
