package com.tessera.backend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "document_collaborators", 
       uniqueConstraints = {
           @UniqueConstraint(columnNames = {"document_id", "user_id"})
       })
@Data
@NoArgsConstructor
@AllArgsConstructor
public class DocumentCollaborator {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "document_id", nullable = false)
    private Document document;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private CollaboratorRole role;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private CollaboratorPermission permission;
    
    @CreationTimestamp
    private LocalDateTime addedAt;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "added_by")
    private User addedBy;
    
    @Column(nullable = false)
    private boolean active = true;
    
    // Campos adicionais para melhor controle
    private String invitationMessage;
    private LocalDateTime lastAccessAt;
    private String removalReason;
}