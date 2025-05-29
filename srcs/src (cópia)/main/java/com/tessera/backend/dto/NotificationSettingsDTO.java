package com.tessera.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class NotificationSettingsDTO {
    
    private Long id;
    
    // Configurações de email
    private boolean emailEnabled;
    private boolean emailDocumentUpdates;
    private boolean emailComments;
    private boolean emailApprovals;
    
    // Configurações de browser
    private boolean browserEnabled;
    private boolean browserDocumentUpdates;
    private boolean browserComments;
    private boolean browserApprovals;
    
    // Configurações gerais
    private String digestFrequency;
    private String quietHoursStart;
    private String quietHoursEnd;
}