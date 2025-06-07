package com.tessera.backend.repository;

import com.tessera.backend.entity.Document;
import com.tessera.backend.entity.DocumentCollaborator;
import com.tessera.backend.entity.CollaboratorRole;
import com.tessera.backend.entity.CollaboratorPermission;
import com.tessera.backend.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import jakarta.persistence.LockModeType;

import java.util.List;
import java.util.Optional;

@Repository
public interface DocumentCollaboratorRepository extends JpaRepository<DocumentCollaborator, Long> {

    List<DocumentCollaborator> findByDocumentAndActiveTrue(Document document);
    List<DocumentCollaborator> findByUserAndActiveTrue(User user);
    Optional<DocumentCollaborator> findByDocumentAndUserAndActiveTrue(Document document, User user);
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    Optional<DocumentCollaborator> findByDocumentAndUser(Document document, User user);

    List<DocumentCollaborator> findByDocumentAndRoleAndActiveTrue(Document document, CollaboratorRole role);

    Optional<DocumentCollaborator> findFirstByDocumentAndRoleAndActiveTrue(Document document, CollaboratorRole role);

    @Query("SELECT COUNT(c) FROM DocumentCollaborator c WHERE c.document = :document AND c.active = true AND c.role IN :roles")
    long countByDocumentAndRolesAndActiveTrue(@Param("document") Document document, @Param("roles") List<CollaboratorRole> roles);

    @Query("SELECT COUNT(c) FROM DocumentCollaborator c WHERE c.document = :document AND c.active = true AND c.role = :role")
    long countByDocumentAndRoleAndActiveTrue(@Param("document") Document document, @Param("role") CollaboratorRole role);

    @Query("SELECT DISTINCT c.document FROM DocumentCollaborator c WHERE c.user = :user AND c.active = true")
    Page<Document> findDocumentsByUser(@Param("user") User user, Pageable pageable);

    boolean existsByDocumentAndUserAndActiveTrue(@Param("document") Document document, @Param("user") User user);
    
    @Query("SELECT CASE WHEN COUNT(c) > 0 THEN true ELSE false END " +
           "FROM DocumentCollaborator c " +
           "WHERE c.document.id = :documentId AND c.user.id = :userId AND c.active = true")
    boolean existsByDocumentIdAndUserIdAndActiveTrue(@Param("documentId") Long documentId, @Param("userId") Long userId);


    @Query("SELECT CASE WHEN COUNT(c) > 0 THEN true ELSE false END " +
           "FROM DocumentCollaborator c " +
           "WHERE c.document.id = :documentId AND c.user.id = :userId AND c.active = true " +
           "AND c.permission IN ('READ_WRITE', 'FULL_ACCESS')")
    boolean existsWithWritePermission(@Param("documentId") Long documentId, @Param("userId") Long userId);
    
    @Query("SELECT CASE WHEN COUNT(c) > 0 THEN true ELSE false END " +
           "FROM DocumentCollaborator c " +
           "WHERE c.document.id = :documentId AND c.user.id = :userId AND c.active = true " +
           "AND (c.permission = 'FULL_ACCESS' OR c.role IN ('PRIMARY_STUDENT', 'PRIMARY_ADVISOR', 'SECONDARY_ADVISOR', 'CO_ADVISOR'))")
    boolean existsWithStatusChangePermission(@Param("documentId") Long documentId, @Param("userId") Long userId);

    @Query("SELECT CASE WHEN COUNT(c) > 0 THEN true ELSE false END " +
           "FROM DocumentCollaborator c " +
           "WHERE c.document.id = :documentId AND c.user.id = :userId AND c.active = true AND c.role = 'PRIMARY_STUDENT'")
    boolean isPrimaryStudent(@Param("documentId") Long documentId, @Param("userId") Long userId);


    List<DocumentCollaborator> findByDocumentAndPermissionAndActiveTrue(@Param("document") Document document,
                                                                       @Param("permission") CollaboratorPermission permission);

    List<DocumentCollaborator> findByDocumentOrderByAddedAtDesc(Document document);

    @Query("SELECT c.role, COUNT(c) FROM DocumentCollaborator c " +
           "WHERE c.document = :document AND c.active = true " +
           "GROUP BY c.role")
    List<Object[]> getCollaboratorStatsByDocument(@Param("document") Document document);

    List<DocumentCollaborator> findAllByDocumentIdInAndActiveTrue(List<Long> documentIds);
}