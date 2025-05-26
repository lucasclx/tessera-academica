package com.tessera.backend.dto;

import com.tessera.backend.entity.CollaboratorRole;
import com.tessera.backend.entity.CollaboratorPermission;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CollaboratorInvitationDTO {
    private Long id;
    private Long documentId;
    private String documentTitle;
    private String inviterName;
    private String inviterEmail;
    private CollaboratorRole role;
    private CollaboratorPermission permission;
    private String message;
    private LocalDateTime invitedAt;
    private LocalDateTime expiresAt;
    private String status; // PENDING, ACCEPTED, REJECTED, EXPIRED
    private String token; // Token único para aceitar convite
}