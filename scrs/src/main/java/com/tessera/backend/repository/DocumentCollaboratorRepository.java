// Arquivo: scrs/src (cópia)/main/java/com/tessera/backend/repository/DocumentCollaboratorRepository.java
package com.tessera.backend.repository;

import com.tessera.backend.entity.Document;
import com.tessera.backend.entity.DocumentCollaborator;
import com.tessera.backend.entity.CollaboratorRole;
import com.tessera.backend.entity.User;
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
    
    // Buscar por papel específico
    List<DocumentCollaborator> findByDocumentAndRoleAndActiveTrue(Document document, CollaboratorRole role);
    
    Optional<DocumentCollaborator> findFirstByDocumentAndRoleAndActiveTrue(Document document, CollaboratorRole role);
    
    // Contar colaboradores por tipo
    @Query("SELECT COUNT(c) FROM DocumentCollaborator c WHERE c.document = :document AND c.active = true AND c.role IN :roles")
    long countByDocumentAndRolesAndActiveTrue(@Param("document") Document document, @Param("roles") List<CollaboratorRole> roles);
    
    @Query("SELECT COUNT(c) FROM DocumentCollaborator c WHERE c.document = :document AND c.active = true AND c.role = :role")
    long countByDocumentAndRoleAndActiveTrue(@Param("document") Document document, @Param("role") CollaboratorRole role);
    
    // Buscar documentos por usuário (usado no DocumentService)
    @Query("SELECT DISTINCT c.document FROM DocumentCollaborator c WHERE c.user = :user AND c.active = true")
    Page<Document> findDocumentsByUser(@Param("user") User user, Pageable pageable);
    
    // Verificar se usuário pode ser colaborador em um documento
    @Query("SELECT CASE WHEN COUNT(c) > 0 THEN true ELSE false END " +
           "FROM DocumentCollaborator c " +
           "WHERE c.document = :document AND c.user = :user AND c.active = true")
    boolean existsByDocumentAndUserAndActiveTrue(@Param("document") Document document, @Param("user") User user);
    
    // Buscar colaboradores por permissão
    @Query("SELECT c FROM DocumentCollaborator c " +
           "WHERE c.document = :document AND c.active = true " +
           "AND c.permission = :permission")
    List<DocumentCollaborator> findByDocumentAndPermissionAndActiveTrue(@Param("document") Document document, 
                                                                       @Param("permission") String permission);
    
    // Histórico de colaboradores (incluindo inativos)
    List<DocumentCollaborator> findByDocumentOrderByAddedAtDesc(Document document);
    
    // Estatísticas úteis
    @Query("SELECT c.role, COUNT(c) FROM DocumentCollaborator c " +
           "WHERE c.document = :document AND c.active = true " +
           "GROUP BY c.role")
    List<Object[]> getCollaboratorStatsByDocument(@Param("document") Document document);

    // NOVO MÉTODO ADICIONADO
    List<DocumentCollaborator> findAllByDocumentIdInAndActiveTrue(List<Long> documentIds);
}