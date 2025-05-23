package com.tessera.backend.repository;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.tessera.backend.entity.Document;
import com.tessera.backend.entity.DocumentStatus;
import com.tessera.backend.entity.User;

@Repository
public interface DocumentRepository extends JpaRepository<Document, Long> {
    
    List<Document> findByStudent(User student);
    
    List<Document> findByAdvisor(User advisor);
    
    // Métodos originais de paginação simples
    Page<Document> findByStudent(User student, Pageable pageable);
    Page<Document> findByAdvisor(User advisor, Pageable pageable);
    
    // Métodos para paginação com filtro de status
    Page<Document> findByAdvisorAndStatus(User advisor, DocumentStatus status, Pageable pageable);
    Page<Document> findByStudentAndStatus(User student, DocumentStatus status, Pageable pageable);

    // NOVOS MÉTODOS PARA BUSCA E FILTRAGEM COMBINADAS

    // Para estudante: busca por título OU descrição, opcionalmente filtra por status
    @Query("SELECT d FROM Document d WHERE d.student = :student " +
           "AND (:status IS NULL OR d.status = :status) " +
           "AND (:searchTerm IS NULL OR LOWER(d.title) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR LOWER(d.description) LIKE LOWER(CONCAT('%', :searchTerm, '%')))")
    Page<Document> findByStudentWithFilters(
            @Param("student") User student,
            @Param("searchTerm") String searchTerm,
            @Param("status") DocumentStatus status,
            Pageable pageable);

    // Para orientador: busca por título, descrição OU nome do estudante, opcionalmente filtra por status
    @Query("SELECT d FROM Document d WHERE d.advisor = :advisor " +
           "AND (:status IS NULL OR d.status = :status) " +
           "AND (:searchTerm IS NULL OR LOWER(d.title) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR LOWER(d.description) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR LOWER(d.student.name) LIKE LOWER(CONCAT('%', :searchTerm, '%')))")
    Page<Document> findByAdvisorWithFilters(
            @Param("advisor") User advisor,
            @Param("searchTerm") String searchTerm,
            @Param("status") DocumentStatus status,
            Pageable pageable);
}