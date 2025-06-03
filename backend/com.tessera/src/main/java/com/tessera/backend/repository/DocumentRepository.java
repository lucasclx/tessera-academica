package com.tessera.backend.repository;

import com.tessera.backend.entity.Document;
import com.tessera.backend.entity.DocumentStatus;
import com.tessera.backend.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DocumentRepository extends JpaRepository<Document, Long> {
    
    // Métodos existentes mantidos para compatibilidade
    Page<Document> findByStudent(User student, Pageable pageable);
    Page<Document> findByAdvisor(User advisor, Pageable pageable);
    Page<Document> findByStudentAndStatus(User student, DocumentStatus status, Pageable pageable);
    Page<Document> findByAdvisorAndStatus(User advisor, DocumentStatus status, Pageable pageable);
    
    // Novos métodos para busca por colaboradores
    @Query("SELECT DISTINCT d FROM Document d " +
           "JOIN d.collaborators c " +
           "WHERE c.user = :user AND c.active = true")
    Page<Document> findByCollaborator(@Param("user") User user, Pageable pageable);
    
    @Query("SELECT DISTINCT d FROM Document d " +
           "JOIN d.collaborators c " +
           "WHERE c.user = :user AND c.active = true AND d.status = :status")
    Page<Document> findByCollaboratorAndStatus(@Param("user") User user, @Param("status") DocumentStatus status, Pageable pageable);
    
    @Query("SELECT DISTINCT d FROM Document d " +
           "JOIN d.collaborators c " +
           "WHERE c.user = :user AND c.active = true " +
           "AND (LOWER(d.title) LIKE LOWER(CONCAT('%', :searchTerm, '%')) " +
           "OR LOWER(d.description) LIKE LOWER(CONCAT('%', :searchTerm, '%')))")
    Page<Document> findByCollaboratorWithSearch(@Param("user") User user, @Param("searchTerm") String searchTerm, Pageable pageable);
    
    @Query("SELECT DISTINCT d FROM Document d " +
           "JOIN d.collaborators c " +
           "WHERE c.user = :user AND c.active = true AND d.status = :status " +
           "AND (LOWER(d.title) LIKE LOWER(CONCAT('%', :searchTerm, '%')) " +
           "OR LOWER(d.description) LIKE LOWER(CONCAT('%', :searchTerm, '%')))")
    Page<Document> findByCollaboratorWithSearchAndStatus(@Param("user") User user, 
                                                        @Param("searchTerm") String searchTerm, 
                                                        @Param("status") DocumentStatus status, 
                                                        Pageable pageable);
    
    // Busca de documentos por papel do colaborador
    @Query("SELECT DISTINCT d FROM Document d " +
           "JOIN d.collaborators c " +
           "WHERE c.user = :user AND c.active = true AND c.role = :role")
    List<Document> findByCollaboratorRole(@Param("user") User user, @Param("role") String role);
    
    // Contagem de documentos por colaborador
    @Query("SELECT COUNT(DISTINCT d) FROM Document d " +
           "JOIN d.collaborators c " +
           "WHERE c.user = :user AND c.active = true")
    long countByCollaborator(@Param("user") User user);

    @Query("SELECT COUNT(DISTINCT d) FROM Document d " +
           "JOIN d.collaborators c " +
           "WHERE c.user = :user AND c.active = true AND d.status = :status")
    long countByCollaboratorAndStatus(@Param("user") User user, @Param("status") DocumentStatus status);

    // ----------------------------------------------------------------------
    // Consultas para listagem geral de documentos (para admins ou páginas de
    // listagem genérica) com filtros de busca e status
    // ----------------------------------------------------------------------

    @Query("SELECT d FROM Document d WHERE (:status IS NULL OR d.status = :status)")
    Page<Document> findAllByStatus(@Param("status") DocumentStatus status, Pageable pageable);

    @Query("SELECT d FROM Document d " +
           "WHERE (:status IS NULL OR d.status = :status) " +
           "AND ( :searchTerm IS NULL OR LOWER(d.title) LIKE LOWER(CONCAT('%', :searchTerm, '%')) " +
           "      OR LOWER(d.description) LIKE LOWER(CONCAT('%', :searchTerm, '%')) )")
    Page<Document> findAllWithFilters(@Param("searchTerm") String searchTerm,
                                      @Param("status") DocumentStatus status,
                                      Pageable pageable);
}