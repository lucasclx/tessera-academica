package com.tessera.backend.repository;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.tessera.backend.entity.Document;
import com.tessera.backend.entity.DocumentStatus;
import com.tessera.backend.entity.User;

@Repository
public interface DocumentRepository extends JpaRepository<Document, Long> {
    
    List<Document> findByStudent(User student);
    
    List<Document> findByAdvisor(User advisor);
    
    Page<Document> findByStudent(User student, Pageable pageable);
    
    Page<Document> findByAdvisor(User advisor, Pageable pageable);
    
    Page<Document> findByAdvisorAndStatus(User advisor, DocumentStatus status, Pageable pageable);
    
    Page<Document> findByStudentAndStatus(User student, DocumentStatus status, Pageable pageable);
}