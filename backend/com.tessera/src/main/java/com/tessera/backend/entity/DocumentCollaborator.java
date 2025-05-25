// 1. NOVA ENTIDADE: DocumentCollaborator.java
package com.tessera.backend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "document_collaborators")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class DocumentCollaborator {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne
    @JoinColumn(name = "document_id", nullable = false)
    private Document document;
    
    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private CollaboratorRole role; // PRIMARY_STUDENT, SECONDARY_STUDENT, PRIMARY_ADVISOR, SECONDARY_ADVISOR
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private CollaboratorPermission permission; // READ_ONLY, READ_WRITE, FULL_ACCESS
    
    @CreationTimestamp
    private LocalDateTime addedAt;
    
    @ManyToOne
    @JoinColumn(name = "added_by")
    private User addedBy;
    
    private boolean active = true;
    
    // Índices únicos para evitar duplicatas
    @Table(uniqueConstraints = {
        @UniqueConstraint(columnNames = {"document_id", "user_id"})
    })
    public static class Constraints {}
}

// 2. ENUM: CollaboratorRole.java
package com.tessera.backend.entity;

public enum CollaboratorRole {
    PRIMARY_STUDENT("Estudante Principal"),
    SECONDARY_STUDENT("Estudante Colaborador"),
    PRIMARY_ADVISOR("Orientador Principal"),
    SECONDARY_ADVISOR("Orientador Colaborador"),
    CO_ADVISOR("Co-orientador");
    
    private final String displayName;
    
    CollaboratorRole(String displayName) {
        this.displayName = displayName;
    }
    
    public String getDisplayName() {
        return displayName;
    }
    
    public boolean isStudent() {
        return this == PRIMARY_STUDENT || this == SECONDARY_STUDENT;
    }
    
    public boolean isAdvisor() {
        return this == PRIMARY_ADVISOR || this == SECONDARY_ADVISOR || this == CO_ADVISOR;
    }
    
    public boolean isPrimary() {
        return this == PRIMARY_STUDENT || this == PRIMARY_ADVISOR;
    }
}

// 3. ENUM: CollaboratorPermission.java
package com.tessera.backend.entity;

public enum CollaboratorPermission {
    READ_ONLY("Apenas Leitura"),
    READ_WRITE("Leitura e Escrita"),
    FULL_ACCESS("Acesso Completo");
    
    private final String displayName;
    
    CollaboratorPermission(String displayName) {
        this.displayName = displayName;
    }
    
    public String getDisplayName() {
        return displayName;
    }
    
    public boolean canRead() {
        return true; // Todos podem ler
    }
    
    public boolean canWrite() {
        return this == READ_WRITE || this == FULL_ACCESS;
    }
    
    public boolean canManageCollaborators() {
        return this == FULL_ACCESS;
    }
    
    public boolean canChangeStatus() {
        return this == FULL_ACCESS;
    }
}

// 4. ATUALIZAÇÃO DA ENTIDADE Document.java
package com.tessera.backend.entity;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "documents")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Document {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false)
    private String title;
    
    @Column(columnDefinition = "TEXT")
    private String description;
    
    // CAMPOS MANTIDOS PARA COMPATIBILIDADE (serão depreciados gradualmente)
    @ManyToOne
    @JoinColumn(name = "student_id")
    private User student;
    
    @ManyToOne
    @JoinColumn(name = "advisor_id")
    private User advisor;
    
    // NOVA RELAÇÃO PARA COLABORADORES
    @OneToMany(mappedBy = "document", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<DocumentCollaborator> collaborators = new ArrayList<>();
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private DocumentStatus status = DocumentStatus.DRAFT;
    
    @OneToMany(mappedBy = "document", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<Version> versions = new ArrayList<>();
    
    @CreationTimestamp
    private LocalDateTime createdAt;
    
    @UpdateTimestamp
    private LocalDateTime updatedAt;
    
    private LocalDateTime submittedAt;
    private LocalDateTime approvedAt;
    private LocalDateTime rejectedAt;
    
    @Column(columnDefinition = "TEXT")
    private String rejectionReason;
    
    // MÉTODOS AUXILIARES PARA COLABORADORES
    
    public List<User> getStudents() {
        return collaborators.stream()
                .filter(c -> c.isActive() && c.getRole().isStudent())
                .map(DocumentCollaborator::getUser)
                .collect(Collectors.toList());
    }
    
    public List<User> getAdvisors() {
        return collaborators.stream()
                .filter(c -> c.isActive() && c.getRole().isAdvisor())
                .map(DocumentCollaborator::getUser)
                .collect(Collectors.toList());
    }
    
    public User getPrimaryStudent() {
        return collaborators.stream()
                .filter(c -> c.isActive() && c.getRole() == CollaboratorRole.PRIMARY_STUDENT)
                .map(DocumentCollaborator::getUser)
                .findFirst()
                .orElse(student); // Fallback para compatibilidade
    }
    
    public User getPrimaryAdvisor() {
        return collaborators.stream()
                .filter(c -> c.isActive() && c.getRole() == CollaboratorRole.PRIMARY_ADVISOR)
                .map(DocumentCollaborator::getUser)
                .findFirst()
                .orElse(advisor); // Fallback para compatibilidade
    }
    
    public boolean hasCollaborator(User user) {
        return collaborators.stream()
                .anyMatch(c -> c.isActive() && c.getUser().getId().equals(user.getId()));
    }
    
    public DocumentCollaborator getCollaborator(User user) {
        return collaborators.stream()
                .filter(c -> c.isActive() && c.getUser().getId().equals(user.getId()))
                .findFirst()
                .orElse(null);
    }
    
    public boolean canUserEdit(User user) {
        DocumentCollaborator collaborator = getCollaborator(user);
        return collaborator != null && collaborator.getPermission().canWrite();
    }
    
    public boolean canUserManageCollaborators(User user) {
        DocumentCollaborator collaborator = getCollaborator(user);
        return collaborator != null && collaborator.getPermission().canManageCollaborators();
    }
    
    public String getStudentNames() {
        List<User> students = getStudents();
        if (students.isEmpty() && student != null) {
            return student.getName();
        }
        return students.stream()
                .map(User::getName)
                .collect(Collectors.joining(", "));
    }
    
    public String getAdvisorNames() {
        List<User> advisors = getAdvisors();
        if (advisors.isEmpty() && advisor != null) {
            return advisor.getName();
        }
        return advisors.stream()
                .map(User::getName)
                .collect(Collectors.joining(", "));
    }
}