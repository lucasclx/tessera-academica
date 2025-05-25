package com.tessera.backend.repository;

import com.tessera.backend.entity.Document;
import com.tessera.backend.entity.DocumentCollaborator;
import com.tessera.backend.entity.User;
import com.tessera.backend.entity.CollaboratorRole;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DocumentCollaboratorRepository extends JpaRepository<DocumentCollaborator, Long> {
    
    List<DocumentCollaborator> findByDocumentAndActiveTrue(Document document);
    
    List<DocumentCollaborator> findByUserAndActiveTrue(User user);
    
    Optional<DocumentCollaborator> findByDocumentAndUserAndActiveTrue(Document document, User user);
    
    boolean existsByDocumentAndUserAndActiveTrue(Document document, User user);
    
    List<DocumentCollaborator> findByDocumentAndRoleAndActiveTrue(Document document, CollaboratorRole role);
    
    @Query("SELECT dc.document FROM DocumentCollaborator dc WHERE dc.user = :user AND dc.active = true")
    Page<Document> findDocumentsByUser(@Param("user") User user, Pageable pageable);
    
    @Query("SELECT dc FROM DocumentCollaborator dc WHERE dc.document = :document AND dc.role IN :roles AND dc.active = true")
    List<DocumentCollaborator> findByDocumentAndRoleInAndActiveTrue(@Param("document") Document document, @Param("roles") List<CollaboratorRole> roles);
    
    @Query("SELECT COUNT(dc) FROM DocumentCollaborator dc WHERE dc.document = :document AND dc.role = :role AND dc.active = true")
    long countByDocumentAndRoleAndActiveTrue(@Param("document") Document document, @Param("role") CollaboratorRole role);
    
    void deleteByDocumentAndUser(Document document, User user);
}