package com.tessera.backend.entity;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
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
    
    // CAMPOS MANTIDOS PARA COMPATIBILIDADE (serão gradualmente depreciados)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id")
    private User student;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "advisor_id")
    private User advisor;
    
    // NOVA RELAÇÃO PARA COLABORADORES MÚLTIPLOS
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
    
    // Campos para colaboração
    private boolean allowMultipleStudents = true;
    private boolean allowMultipleAdvisors = true;
    private int maxStudents = 5;
    private int maxAdvisors = 3;
    
    // =============================================================================
    // MÉTODOS PARA GERENCIAR COLABORADORES
    // =============================================================================
    
    /**
     * Retorna todos os estudantes ativos (incluindo principal e colaboradores)
     */
    public List<User> getAllStudents() {
        return collaborators.stream()
                .filter(c -> c.isActive() && c.getRole().isStudent())
                .map(DocumentCollaborator::getUser)
                .collect(Collectors.toList());
    }
    
    /**
     * Retorna todos os orientadores ativos (incluindo principal e colaboradores)
     */
    public List<User> getAllAdvisors() {
        return collaborators.stream()
                .filter(c -> c.isActive() && c.getRole().isAdvisor())
                .map(DocumentCollaborator::getUser)
                .collect(Collectors.toList());
    }
    
    /**
     * Retorna o estudante principal
     */
    public User getPrimaryStudent() {
        return collaborators.stream()
                .filter(c -> c.isActive() && c.getRole() == CollaboratorRole.PRIMARY_STUDENT)
                .map(DocumentCollaborator::getUser)
                .findFirst()
                .orElse(student); // Fallback para compatibilidade
    }
    
    /**
     * Retorna o orientador principal
     */
    public User getPrimaryAdvisor() {
        return collaborators.stream()
                .filter(c -> c.isActive() && c.getRole() == CollaboratorRole.PRIMARY_ADVISOR)
                .map(DocumentCollaborator::getUser)
                .findFirst()
                .orElse(advisor); // Fallback para compatibilidade
    }
    
    /**
     * Retorna todos os co-autores/estudantes colaboradores
     */
    public List<User> getCoStudents() {
        return collaborators.stream()
                .filter(c -> c.isActive() && 
                        (c.getRole() == CollaboratorRole.SECONDARY_STUDENT || 
                         c.getRole() == CollaboratorRole.CO_STUDENT))
                .map(DocumentCollaborator::getUser)
                .collect(Collectors.toList());
    }
    
    /**
     * Retorna todos os co-orientadores
     */
    public List<User> getCoAdvisors() {
        return collaborators.stream()
                .filter(c -> c.isActive() && 
                        (c.getRole() == CollaboratorRole.SECONDARY_ADVISOR || 
                         c.getRole() == CollaboratorRole.CO_ADVISOR ||
                         c.getRole() == CollaboratorRole.EXTERNAL_ADVISOR))
                .map(DocumentCollaborator::getUser)
                .collect(Collectors.toList());
    }
    
    /**
     * Verifica se um usuário é colaborador ativo
     */
    public boolean hasCollaborator(User user) {
        return collaborators.stream()
                .anyMatch(c -> c.isActive() && c.getUser().getId().equals(user.getId()));
    }
    
    /**
     * Obtém o colaborador específico de um usuário
     */
    public Optional<DocumentCollaborator> getCollaborator(User user) {
        return collaborators.stream()
                .filter(c -> c.isActive() && c.getUser().getId().equals(user.getId()))
                .findFirst();
    }
    
    /**
     * Verifica se o usuário pode editar o documento
     */
    public boolean canUserEdit(User user) {
        return getCollaborator(user)
                .map(c -> c.getPermission().canWrite() && c.getRole().canEdit())
                .orElse(false);
    }
    
    /**
     * Verifica se o usuário pode gerenciar colaboradores
     */
    public boolean canUserManageCollaborators(User user) {
        return getCollaborator(user)
                .map(c -> c.getPermission().canManageCollaborators() || 
                         c.getRole().canManageCollaborators())
                .orElse(false);
    }
    
    /**
     * Verifica se o usuário pode submeter o documento
     */
    public boolean canUserSubmitDocument(User user) {
        return getCollaborator(user)
                .map(c -> c.getRole().canSubmitDocument() && 
                         (c.getPermission().canWrite() || c.getPermission() == CollaboratorPermission.FULL_ACCESS))
                .orElse(false);
    }
    
    /**
     * Verifica se o usuário pode aprovar o documento
     */
    public boolean canUserApproveDocument(User user) {
        return getCollaborator(user)
                .map(c -> c.getRole().canApproveDocument())
                .orElse(false);
    }
    
    /**
     * Retorna uma string com os nomes de todos os estudantes
     */
    public String getAllStudentNames() {
        List<User> students = getAllStudents();
        if (students.isEmpty() && student != null) {
            return student.getName();
        }
        return students.stream()
                .map(User::getName)
                .collect(Collectors.joining(", "));
    }
    
    /**
     * Retorna uma string com os nomes de todos os orientadores
     */
    public String getAllAdvisorNames() {
        List<User> advisors = getAllAdvisors();
        if (advisors.isEmpty() && advisor != null) {
            return advisor.getName();
        }
        return advisors.stream()
                .map(User::getName)
                .collect(Collectors.joining(", "));
    }
    
    /**
     * Conta estudantes ativos
     */
    public int getActiveStudentCount() {
        return (int) collaborators.stream()
                .filter(c -> c.isActive() && c.getRole().isStudent())
                .count();
    }
    
    /**
     * Conta orientadores ativos
     */
    public int getActiveAdvisorCount() {
        return (int) collaborators.stream()
                .filter(c -> c.isActive() && c.getRole().isAdvisor())
                .count();
    }
    
    /**
     * Verifica se ainda pode adicionar estudantes
     */
    public boolean canAddMoreStudents() {
        return allowMultipleStudents && getActiveStudentCount() < maxStudents;
    }
    
    /**
     * Verifica se ainda pode adicionar orientadores
     */
    public boolean canAddMoreAdvisors() {
        return allowMultipleAdvisors && getActiveAdvisorCount() < maxAdvisors;
    }
    
    /**
     * Verifica se tem estudante principal definido
     */
    public boolean hasPrimaryStudent() {
        return collaborators.stream()
                .anyMatch(c -> c.isActive() && c.getRole() == CollaboratorRole.PRIMARY_STUDENT);
    }
    
    /**
     * Verifica se tem orientador principal definido
     */
    public boolean hasPrimaryAdvisor() {
        return collaborators.stream()
                .anyMatch(c -> c.isActive() && c.getRole() == CollaboratorRole.PRIMARY_ADVISOR);
    }
}
