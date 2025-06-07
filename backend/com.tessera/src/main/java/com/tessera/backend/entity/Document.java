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
    
    private boolean allowMultipleStudents = true;
    private boolean allowMultipleAdvisors = true;
    private int maxStudents = 5;
    private int maxAdvisors = 3;
    
    public List<User> getAllStudents() {
        return collaborators.stream()
                .filter(c -> c.isActive() && c.getRole().isStudent())
                .map(DocumentCollaborator::getUser)
                .collect(Collectors.toList());
    }
    
    public List<User> getAllAdvisors() {
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
                .orElse(null);
    }
    
    public User getPrimaryAdvisor() {
        return collaborators.stream()
                .filter(c -> c.isActive() && c.getRole() == CollaboratorRole.PRIMARY_ADVISOR)
                .map(DocumentCollaborator::getUser)
                .findFirst()
                .orElse(null);
    }
    
    public List<User> getCoStudents() {
        return collaborators.stream()
                .filter(c -> c.isActive() && 
                        (c.getRole() == CollaboratorRole.SECONDARY_STUDENT || 
                         c.getRole() == CollaboratorRole.CO_STUDENT))
                .map(DocumentCollaborator::getUser)
                .collect(Collectors.toList());
    }
    
    public List<User> getCoAdvisors() {
        return collaborators.stream()
                .filter(c -> c.isActive() && 
                        (c.getRole() == CollaboratorRole.SECONDARY_ADVISOR || 
                         c.getRole() == CollaboratorRole.CO_ADVISOR ||
                         c.getRole() == CollaboratorRole.EXTERNAL_ADVISOR))
                .map(DocumentCollaborator::getUser)
                .collect(Collectors.toList());
    }
    
    public boolean hasCollaborator(User user) {
        return collaborators.stream()
                .anyMatch(c -> c.isActive() && c.getUser().getId().equals(user.getId()));
    }
    
    public Optional<DocumentCollaborator> getCollaborator(User user) {
        return collaborators.stream()
                .filter(c -> c.isActive() && c.getUser().getId().equals(user.getId()))
                .findFirst();
    }
    
    @Deprecated
    public boolean canUserEdit(User user) {
        return getCollaborator(user)
                .map(c -> c.getPermission().canWrite() && c.getRole().canEdit())
                .orElse(false);
    }
    
    @Deprecated
    public boolean canUserManageCollaborators(User user) {
        return getCollaborator(user)
                .map(c -> c.getPermission().canManageCollaborators() || 
                         c.getRole().canManageCollaborators())
                .orElse(false);
    }
    
    @Deprecated
    public boolean canUserSubmitDocument(User user) {
        return getCollaborator(user)
                .map(c -> c.getRole().canSubmitDocument() && 
                         (c.getPermission().canWrite() || c.getPermission() == CollaboratorPermission.FULL_ACCESS))
                .orElse(false);
    }
    
    @Deprecated
    public boolean canUserApproveDocument(User user) {
        return getCollaborator(user)
                .map(c -> c.getRole().canApproveDocument())
                .orElse(false);
    }
    
    public String getAllStudentNames() {
        List<User> students = getAllStudents();
        return students.stream()
                .map(User::getName)
                .collect(Collectors.joining(", "));
    }
    
    public String getAllAdvisorNames() {
        List<User> advisors = getAllAdvisors();
        return advisors.stream()
                .map(User::getName)
                .collect(Collectors.joining(", "));
    }
    
    public int getActiveStudentCount() {
        return (int) collaborators.stream()
                .filter(c -> c.isActive() && c.getRole().isStudent())
                .count();
    }
    
    public int getActiveAdvisorCount() {
        return (int) collaborators.stream()
                .filter(c -> c.isActive() && c.getRole().isAdvisor())
                .count();
    }
    
    public boolean canAddMoreStudents() {
        return allowMultipleStudents && getActiveStudentCount() < maxStudents;
    }
    
    public boolean canAddMoreAdvisors() {
        return allowMultipleAdvisors && getActiveAdvisorCount() < maxAdvisors;
    }
    
    public boolean hasPrimaryStudent() {
        return collaborators.stream()
                .anyMatch(c -> c.isActive() && c.getRole() == CollaboratorRole.PRIMARY_STUDENT);
    }
    
    public boolean hasPrimaryAdvisor() {
        return collaborators.stream()
                .anyMatch(c -> c.isActive() && c.getRole() == CollaboratorRole.PRIMARY_ADVISOR);
    }
}