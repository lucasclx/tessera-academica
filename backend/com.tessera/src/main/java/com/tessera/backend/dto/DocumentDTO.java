package com.tessera.backend.dto;

import java.time.LocalDateTime;
import com.tessera.backend.entity.DocumentStatus;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DocumentDTO {
    private Long id;
    private String title;
    private String description;
    private DocumentStatus status;
    @Positive(message = "ID do orientador deve ser positivo")
    private Long advisorId;
    private String studentName;
    private String advisorName;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime submittedAt;
    private LocalDateTime approvedAt;
    private LocalDateTime rejectedAt;
    private String rejectionReason;
    private Integer versionCount;
}