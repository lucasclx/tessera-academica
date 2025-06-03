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
public class CommentDTO {
    
    private Long id;
    
    @NotNull(message = "ID da versão é obrigatório")
    private Long versionId;
    
    @NotBlank(message = "Conteúdo é obrigatório")
    private String content;
    
    private Integer startPosition;
    
    private Integer endPosition;
    
    private boolean resolved;
    
    private LocalDateTime resolvedAt;
    
    private Long resolvedById;
    
    private String resolvedByName;
    
    private Long userId;
    
    private String userName;
    
    private LocalDateTime createdAt;
    
    private LocalDateTime updatedAt;
}