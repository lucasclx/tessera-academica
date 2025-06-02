package com.tessera.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class NotificationSummaryDTO {
    
    private long unreadCount;
    private long totalCount;
    private boolean hasUrgent;
    private long documentsCount;
    private long commentsCount;
    private long approvalsCount;
}