package com.tessera.backend.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import com.tessera.backend.entity.Document;
import com.tessera.backend.entity.Version;

@Repository
public interface VersionRepository extends JpaRepository<Version, Long> {
    
    List<Version> findByDocumentOrderByCreatedAtDesc(Document document);
    
    Page<Version> findByDocumentOrderByCreatedAtDesc(Document document, Pageable pageable);
    
    @Query("SELECT v FROM Version v WHERE v.document = ?1 ORDER BY v.createdAt DESC")
    List<Version> findVersionHistory(Document document);
    
    @Query("SELECT v FROM Version v WHERE v.document = ?1 ORDER BY v.createdAt DESC LIMIT 1")
    Optional<Version> findLatestByDocument(Document document);
}