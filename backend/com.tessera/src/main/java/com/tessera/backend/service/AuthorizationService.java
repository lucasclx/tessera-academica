// src/main/java/com/tessera/backend/service/AuthorizationService.java
package com.tessera.backend.service;

import com.tessera.backend.entity.Document;
import com.tessera.backend.entity.User;
import com.tessera.backend.entity.Version;
import com.tessera.backend.entity.Comment;
import com.tessera.backend.entity.DocumentStatus;
import com.tessera.backend.repository.DocumentRepository;
import com.tessera.backend.exception.ResourceNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.Objects;

@Service
public class AuthorizationService {
    
    private static final Logger logger = LoggerFactory.getLogger(AuthorizationService.class);
    
    @Autowired
    private DocumentRepository documentRepository;
    
    // ========================================
    // DOCUMENT PERMISSIONS
    // ========================================
    
    /**
     * Verifica se o usuário pode acessar um documento
     */
    public boolean canAccessDocument(User user, Long documentId) {
        if (user == null || documentId == null) {
            logger.warn("Tentativa de acesso com user ou documentId nulo");
            return false;
        }
        
        try {
            Document document = documentRepository.findById(documentId)
                .orElseThrow(() -> new ResourceNotFoundException("Documento não encontrado"));
            
            return canAccessDocument(user, document);
        } catch (Exception e) {
            logger.error("Erro ao verificar acesso ao documento {}: {}", documentId, e.getMessage());
            return false;
        }
    }
    
    public boolean canAccessDocument(User user, Document document) {
        if (user == null || document == null) {
            return false;
        }
        
        // Admin pode acessar qualquer documento
        if (hasRole(user, "ADMIN")) {
            logger.debug("Acesso concedido ao admin {} para documento {}", user.getEmail(), document.getId());
            return true;
        }
        
        // Estudante pode acessar seus próprios documentos
        if (hasRole(user, "STUDENT") && 
            document.getStudent() != null && 
            Objects.equals(document.getStudent().getId(), user.getId())) {
            logger.debug("Acesso concedido ao estudante {} para seu documento {}", user.getEmail(), document.getId());
            return true;
        }
        
        // Orientador pode acessar documentos que orienta
        if (hasRole(user, "ADVISOR") && 
            document.getAdvisor() != null && 
            Objects.equals(document.getAdvisor().getId(), user.getId())) {
            logger.debug("Acesso concedido ao orientador {} para documento {}", user.getEmail(), document.getId());
            return true;
        }
        
        logger.warn("Acesso negado ao usuário {} para documento {}", user.getEmail(), document.getId());
        return false;
    }
    
    /**
     * Verifica se o usuário pode editar um documento
     */
    public boolean canEditDocument(User user, Document document) {
        if (user == null || document == null) {
            return false;
        }
        
        // Admin pode editar qualquer documento
        if (hasRole(user, "ADMIN")) {
            logger.debug("Edição concedida ao admin {} para documento {}", user.getEmail(), document.getId());
            return true;
        }
        
        // Apenas o estudante proprietário pode editar
        if (!hasRole(user, "STUDENT") || 
            document.getStudent() == null || 
            !Objects.equals(document.getStudent().getId(), user.getId())) {
            logger.warn("Edição negada: usuário {} não é o proprietário do documento {}", 
                       user.getEmail(), document.getId());
            return false;
        }
        
        // Verificar status do documento - só pode editar em DRAFT ou REVISION
        DocumentStatus status = document.getStatus();
        boolean canEdit = (status == DocumentStatus.DRAFT || status == DocumentStatus.REVISION);
        
        if (!canEdit) {
            logger.warn("Edição negada: documento {} está no status {} (permitido: DRAFT, REVISION)", 
                       document.getId(), status);
        } else {
            logger.debug("Edição concedida ao estudante {} para documento {} (status: {})", 
                        user.getEmail(), document.getId(), status);
        }
        
        return canEdit;
    }
    
    /**
     * Verifica se o usuário pode alterar o status de um documento
     */
    public boolean canChangeDocumentStatus(User user, Document document, DocumentStatus newStatus) {
        if (user == null || document == null || newStatus == null) {
            return false;
        }
        
        DocumentStatus currentStatus = document.getStatus();
        
        // Admin pode alterar qualquer status
        if (hasRole(user, "ADMIN")) {
            logger.debug("Alteração de status concedida ao admin {} para documento {} ({} -> {})", 
                        user.getEmail(), document.getId(), currentStatus, newStatus);
            return true;
        }
        
        // Regras específicas por role e status
        if (hasRole(user, "STUDENT") && 
            document.getStudent() != null && 
            Objects.equals(document.getStudent().getId(), user.getId())) {
            
            // Estudante pode submeter documentos próprios (DRAFT/REVISION -> SUBMITTED)
            if (newStatus == DocumentStatus.SUBMITTED && 
                (currentStatus == DocumentStatus.DRAFT || currentStatus == DocumentStatus.REVISION)) {
                logger.debug("Submissão concedida ao estudante {} para documento {} ({} -> {})", 
                            user.getEmail(), document.getId(), currentStatus, newStatus);
                return true;
            }
        }
        
        if (hasRole(user, "ADVISOR") && 
            document.getAdvisor() != null && 
            Objects.equals(document.getAdvisor().getId(), user.getId())) {
            
            // Orientador pode aprovar documentos submetidos
            if (newStatus == DocumentStatus.APPROVED && currentStatus == DocumentStatus.SUBMITTED) {
                logger.debug("Aprovação concedida ao orientador {} para documento {} ({} -> {})", 
                            user.getEmail(), document.getId(), currentStatus, newStatus);
                return true;
            }
            
            // Orientador pode solicitar revisão de documentos submetidos
            if (newStatus == DocumentStatus.REVISION && currentStatus == DocumentStatus.SUBMITTED) {
                logger.debug("Solicitação de revisão concedida ao orientador {} para documento {} ({} -> {})", 
                            user.getEmail(), document.getId(), currentStatus, newStatus);
                return true;
            }
            
            // Orientador pode finalizar documentos aprovados
            if (newStatus == DocumentStatus.FINALIZED && currentStatus == DocumentStatus.APPROVED) {
                logger.debug("Finalização concedida ao orientador {} para documento {} ({} -> {})", 
                            user.getEmail(), document.getId(), currentStatus, newStatus);
                return true;
            }
        }
        
        logger.warn("Alteração de status negada: usuário {} tentou mudar documento {} de {} para {}", 
                   user.getEmail(), document.getId(), currentStatus, newStatus);
        return false;
    }
    
    /**
     * Verifica se o usuário pode deletar um documento
     */
    public boolean canDeleteDocument(User user, Document document) {
        if (user == null || document == null) {
            return false;
        }
        
        // Admin pode deletar qualquer documento
        if (hasRole(user, "ADMIN")) {
            logger.debug("Exclusão concedida ao admin {} para documento {}", user.getEmail(), document.getId());
            return true;
        }
        
        // Estudante pode deletar apenas documentos próprios em DRAFT
        boolean isOwner = hasRole(user, "