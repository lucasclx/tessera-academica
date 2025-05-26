package com.tessera.backend.dto;

import java.time.LocalDateTime;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class VersionDTO {
    
    private Long id;
    
    @NotNull(message = "ID do documento é obrigatório")
    private Long documentId;
    
    private String versionNumber;
    
    private String commitMessage;
    
    @NotBlank(message = "Conteúdo é obrigatório")
    private String content;
    
    private String diffFromPrevious;
    
    private Long createdById;
    
    private String createdByName;
    
    private LocalDateTime createdAt;
    
    private Integer commentCount;
}