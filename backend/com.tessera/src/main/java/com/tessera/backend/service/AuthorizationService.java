// src/main/java/com/tessera/backend/service/AuthorizationService.java
package com.tessera.backend.service;

import com.tessera.backend.entity.Document;
import com.tessera.backend.entity.User;
import com.tessera.backend.entity.Version;
import com.tessera.backend.entity.Comment;
import com.tessera.backend.entity.DocumentStatus;
import com.tessera.backend.entity.Notification;
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
    
    @Autowired
    private AuditLogService auditLogService;
    
    // ========================================
    // DOCUMENT PERMISSIONS
    // ========================================
    
    /**
     * Verifica se o usuário pode acessar um documento
     */
    public boolean canAccessDocument(User user, Long documentId) {
        if (user == null || documentId == null) {
            logger.warn("Tentativa de acesso com user ou documentId nulo");
            auditLogService.logUnauthorizedAccess(user, "DOCUMENT_ACCESS", documentId, "User ou documentId nulo");
            return false;
        }
        
        try {
            Document document = documentRepository.findById(documentId)
                .orElseThrow(() -> new ResourceNotFoundException("Documento não encontrado"));
            
            boolean canAccess = canAccessDocument(user, document);
            
            if (!canAccess) {
                auditLogService.logUnauthorizedAccess(user, "DOCUMENT_ACCESS", documentId, "Permissão negada");
            }
            
            return canAccess;
        } catch (Exception e) {
            logger.error("Erro ao verificar acesso ao documento {}: {}", documentId, e.getMessage());
            auditLogService.logSystemError(user, "DOCUMENT_ACCESS", documentId, e.getMessage());
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
            auditLogService.logSuccessfulAction(user, "DOCUMENT_EDIT_PERMISSION_GRANTED", document.getId(), "Admin permission");
            return true;
        }
        
        // Apenas o estudante proprietário pode editar
        if (!hasRole(user, "STUDENT") || 
            document.getStudent() == null || 
            !Objects.equals(document.getStudent().getId(), user.getId())) {
            logger.warn("Edição negada: usuário {} não é o proprietário do documento {}", 
                       user.getEmail(), document.getId());
            auditLogService.logUnauthorizedAccess(user, "DOCUMENT_EDIT", document.getId(), "Não é proprietário");
            return false;
        }
        
        // Verificar status do documento - só pode editar em DRAFT ou REVISION
        DocumentStatus status = document.getStatus();
        boolean canEdit = (status == DocumentStatus.DRAFT || status == DocumentStatus.REVISION);
        
        if (!canEdit) {
            logger.warn("Edição negada: documento {} está no status {} (permitido: DRAFT, REVISION)", 
                       document.getId(), status);
            auditLogService.logUnauthorizedAccess(user, "DOCUMENT_EDIT", document.getId(), 
                "Status inválido: " + status);
        } else {
            logger.debug("Edição concedida ao estudante {} para documento {} (status: {})", 
                        user.getEmail(), document.getId(), status);
            auditLogService.logSuccessfulAction(user, "DOCUMENT_EDIT_PERMISSION_GRANTED", document.getId(), 
                "Status: " + status);
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
            auditLogService.logSuccessfulAction(user, "DOCUMENT_STATUS_CHANGE_PERMISSION_GRANTED", 
                document.getId(), String.format("%s -> %s (Admin)", currentStatus, newStatus));
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
                auditLogService.logSuccessfulAction(user, "DOCUMENT_SUBMISSION_PERMISSION_GRANTED", 
                    document.getId(), String.format("%s -> %s", currentStatus, newStatus));
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
                auditLogService.logSuccessfulAction(user, "DOCUMENT_APPROVAL_PERMISSION_GRANTED", 
                    document.getId(), String.format("%s -> %s", currentStatus, newStatus));
                return true;
            }
            
            // Orientador pode solicitar revisão de documentos submetidos
            if (newStatus == DocumentStatus.REVISION && currentStatus == DocumentStatus.SUBMITTED) {
                logger.debug("Solicitação de revisão concedida ao orientador {} para documento {} ({} -> {})", 
                            user.getEmail(), document.getId(), currentStatus, newStatus);
                auditLogService.logSuccessfulAction(user, "DOCUMENT_REVISION_REQUEST_PERMISSION_GRANTED", 
                    document.getId(), String.format("%s -> %s", currentStatus, newStatus));
                return true;
            }
            
            // Orientador pode finalizar documentos aprovados
            if (newStatus == DocumentStatus.FINALIZED && currentStatus == DocumentStatus.APPROVED) {
                logger.debug("Finalização concedida ao orientador {} para documento {} ({} -> {})", 
                            user.getEmail(), document.getId(), currentStatus, newStatus);
                auditLogService.logSuccessfulAction(user, "DOCUMENT_FINALIZATION_PERMISSION_GRANTED", 
                    document.getId(), String.format("%s -> %s", currentStatus, newStatus));
                return true;
            }
        }
        
        logger.warn("Alteração de status negada: usuário {} tentou mudar documento {} de {} para {}", 
                   user.getEmail(), document.getId(), currentStatus, newStatus);
        auditLogService.logUnauthorizedAccess(user, "DOCUMENT_STATUS_CHANGE", document.getId(), 
            String.format("Tentativa de mudança não autorizada: %s -> %s", currentStatus, newStatus));
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
            auditLogService.logSuccessfulAction(user, "DOCUMENT_DELETE_PERMISSION_GRANTED", 
                document.getId(), "Admin permission");
            return true;
        }
        
        // Estudante pode deletar apenas documentos próprios em DRAFT
        boolean isOwner = hasRole(user, "STUDENT") && 
                         document.getStudent() != null && 
                         Objects.equals(document.getStudent().getId(), user.getId());
        
        boolean isDraft = document.getStatus() == DocumentStatus.DRAFT;
        
        if (isOwner && isDraft) {
            logger.debug("Exclusão concedida ao estudante {} para seu documento {} (status: DRAFT)", 
                        user.getEmail(), document.getId());
            auditLogService.logSuccessfulAction(user, "DOCUMENT_DELETE_PERMISSION_GRANTED", 
                document.getId(), "Owner in DRAFT status");
            return true;
        }
        
        String reason = !isOwner ? "Não é proprietário" : "Status não é DRAFT";
        logger.warn("Exclusão negada ao usuário {} para documento {} ({})", 
                   user.getEmail(), document.getId(), reason);
        auditLogService.logUnauthorizedAccess(user, "DOCUMENT_DELETE", document.getId(), reason);
        return false;
    }
    
    // ========================================
    // VERSION PERMISSIONS
    // ========================================
    
    /**
     * Verifica se o usuário pode criar uma versão
     */
    public boolean canCreateVersion(User user, Document document) {
        if (user == null || document == null) {
            return false;
        }
        
        // Admin pode criar versões em qualquer documento
        if (hasRole(user, "ADMIN")) {
            logger.debug("Criação de versão concedida ao admin {} para documento {}", 
                        user.getEmail(), document.getId());
            return true;
        }
        
        // Apenas o estudante proprietário pode criar versões
        boolean isOwner = hasRole(user, "STUDENT") && 
                         document.getStudent() != null && 
                         Objects.equals(document.getStudent().getId(), user.getId());
        
        // Só pode criar versões em documentos DRAFT ou REVISION
        boolean canCreateVersion = isOwner && 
                                  (document.getStatus() == DocumentStatus.DRAFT || 
                                   document.getStatus() == DocumentStatus.REVISION);
        
        if (!canCreateVersion) {
            String reason = !isOwner ? "Não é proprietário" : 
                           "Status não permite criação de versão: " + document.getStatus();
            logger.warn("Criação de versão negada ao usuário {} para documento {} ({})", 
                       user.getEmail(), document.getId(), reason);
            auditLogService.logUnauthorizedAccess(user, "VERSION_CREATE", document.getId(), reason);
        } else {
            logger.debug("Criação de versão concedida ao estudante {} para documento {} (status: {})", 
                        user.getEmail(), document.getId(), document.getStatus());
            auditLogService.logSuccessfulAction(user, "VERSION_CREATE_PERMISSION_GRANTED", 
                document.getId(), "Status: " + document.getStatus());
        }
        
        return canCreateVersion;
    }
    
    /**
     * Verifica se o usuário pode acessar uma versão
     */
    public boolean canAccessVersion(User user, Version version) {
        if (user == null || version == null || version.getDocument() == null) {
            return false;
        }
        
        // Se pode acessar o documento, pode acessar suas versões
        return canAccessDocument(user, version.getDocument());
    }
    
    // ========================================
    // COMMENT PERMISSIONS
    // ========================================
    
    /**
     * Verifica se o usuário pode comentar em uma versão
     */
    public boolean canCommentOnVersion(User user, Version version) {
        if (user == null || version == null || version.getDocument() == null) {
            return false;
        }
        
        Document document = version.getDocument();
        
        // Admin pode comentar em qualquer versão
        if (hasRole(user, "ADMIN")) {
            return true;
        }
        
        // Estudante proprietário pode comentar
        boolean isStudentOwner = hasRole(user, "STUDENT") && 
                                document.getStudent() != null && 
                                Objects.equals(document.getStudent().getId(), user.getId());
        
        // Orientador responsável pode comentar
        boolean isAdvisor = hasRole(user, "ADVISOR") && 
                           document.getAdvisor() != null && 
                           Objects.equals(document.getAdvisor().getId(), user.getId());
        
        boolean canComment = isStudentOwner || isAdvisor;
        
        if (!canComment) {
            logger.warn("Comentário negado ao usuário {} na versão {} do documento {}", 
                       user.getEmail(), version.getId(), document.getId());
            auditLogService.logUnauthorizedAccess(user, "COMMENT_CREATE", version.getId(), 
                "Não é proprietário nem orientador");
        }
        
        return canComment;
    }
    
    /**
     * Verifica se o usuário pode editar um comentário
     */
    public boolean canEditComment(User user, Comment comment) {
        if (user == null || comment == null) {
            return false;
        }
        
        // Admin pode editar qualquer comentário
        if (hasRole(user, "ADMIN")) {
            return true;
        }
        
        // Apenas o autor do comentário pode editá-lo
        boolean isAuthor = Objects.equals(comment.getUser().getId(), user.getId());
        
        if (!isAuthor) {
            logger.warn("Edição de comentário negada ao usuário {} para comentário {} (não é autor)", 
                       user.getEmail(), comment.getId());
            auditLogService.logUnauthorizedAccess(user, "COMMENT_EDIT", comment.getId(), "Não é autor");
        }
        
        return isAuthor;
    }
    
    /**
     * Verifica se o usuário pode deletar um comentário
     */
    public boolean canDeleteComment(User user, Comment comment) {
        if (user == null || comment == null) {
            return false;
        }
        
        // Admin pode deletar qualquer comentário
        if (hasRole(user, "ADMIN")) {
            return true;
        }
        
        Document document = comment.getVersion().getDocument();
        
        // Autor do comentário pode deletar
        boolean isAuthor = Objects.equals(comment.getUser().getId(), user.getId());
        
        // Estudante proprietário do documento pode deletar comentários
        boolean isDocumentOwner = hasRole(user, "STUDENT") && 
                                 document.getStudent() != null && 
                                 Objects.equals(document.getStudent().getId(), user.getId());
        
        // Orientador responsável pode deletar comentários
        boolean isAdvisor = hasRole(user, "ADVISOR") && 
                           document.getAdvisor() != null && 
                           Objects.equals(document.getAdvisor().getId(), user.getId());
        
        boolean canDelete = isAuthor || isDocumentOwner || isAdvisor;
        
        if (!canDelete) {
            logger.warn("Exclusão de comentário negada ao usuário {} para comentário {}", 
                       user.getEmail(), comment.getId());
            auditLogService.logUnauthorizedAccess(user, "COMMENT_DELETE", comment.getId(), 
                "Não é autor, proprietário do documento nem orientador");
        }
        
        return canDelete;
    }
    
    /**
     * Verifica se o usuário pode resolver um comentário
     */
    public boolean canResolveComment(User user, Comment comment) {
        if (user == null || comment == null) {
            return false;
        }
        
        // Admin pode resolver qualquer comentário
        if (hasRole(user, "ADMIN")) {
            return true;
        }
        
        Document document = comment.getVersion().getDocument();
        
        // Estudante proprietário pode resolver comentários
        boolean isDocumentOwner = hasRole(user, "STUDENT") && 
                                 document.getStudent() != null && 
                                 Objects.equals(document.getStudent().getId(), user.getId());
        
        // Orientador responsável pode resolver comentários
        boolean isAdvisor = hasRole(user, "ADVISOR") && 
                           document.getAdvisor() != null && 
                           Objects.equals(document.getAdvisor().getId(), user.getId());
        
        boolean canResolve = isDocumentOwner || isAdvisor;
        
        if (!canResolve) {
            logger.warn("Resolução de comentário negada ao usuário {} para comentário {}", 
                       user.getEmail(), comment.getId());
            auditLogService.logUnauthorizedAccess(user, "COMMENT_RESOLVE", comment.getId(), 
                "Não é proprietário do documento nem orientador");
        }
        
        return canResolve;
    }
    
    // ========================================
    // NOTIFICATION PERMISSIONS
    // ========================================
    
    /**
     * Verifica se o usuário pode acessar uma notificação
     */
    public boolean canAccessNotification(User user, Notification notification) {
        if (user == null || notification == null) {
            return false;
        }
        
        // Admin pode acessar qualquer notificação
        if (hasRole(user, "ADMIN")) {
            return true;
        }
        
        // Usuário só pode acessar suas próprias notificações
        boolean isOwner = Objects.equals(notification.getUser().getId(), user.getId());
        
        if (!isOwner) {
            logger.warn("Acesso à notificação negado ao usuário {} para notificação {} (não é proprietário)", 
                       user.getEmail(), notification.getId());
            auditLogService.logUnauthorizedAccess(user, "NOTIFICATION_ACCESS", notification.getId(), 
                "Não é proprietário");
        }
        
        return isOwner;
    }
    
    // ========================================
    // ADMIN PERMISSIONS
    // ========================================
    
    /**
     * Verifica se o usuário pode gerenciar outros usuários
     */
    public boolean canManageUsers(User user) {
        if (user == null) {
            return false;
        }
        
        boolean isAdmin = hasRole(user, "ADMIN");
        
        if (!isAdmin) {
            logger.warn("Gerenciamento de usuários negado ao usuário {} (não é admin)", user.getEmail());
            auditLogService.logUnauthorizedAccess(user, "USER_MANAGEMENT", null, "Não é admin");
        }
        
        return isAdmin;
    }
    
    /**
     * Verifica se o usuário pode aprovar/rejeitar registros
     */
    public boolean canManageRegistrations(User user) {
        if (user == null) {
            return false;
        }
        
        boolean isAdmin = hasRole(user, "ADMIN");
        
        if (!isAdmin) {
            logger.warn("Gerenciamento de registros negado ao usuário {} (não é admin)", user.getEmail());
            auditLogService.logUnauthorizedAccess(user, "REGISTRATION_MANAGEMENT", null, "Não é admin");
        }
        
        return isAdmin;
    }
    
    /**
     * Verifica se o usuário pode acessar estatísticas do sistema
     */
    public boolean canAccessSystemStats(User user) {
        if (user == null) {
            return false;
        }
        
        boolean isAdmin = hasRole(user, "ADMIN");
        
        if (!isAdmin) {
            logger.warn("Acesso a estatísticas negado ao usuário {} (não é admin)", user.getEmail());
            auditLogService.logUnauthorizedAccess(user, "SYSTEM_STATS_ACCESS", null, "Não é admin");
        }
        
        return isAdmin;
    }
    
    // ========================================
    // UTILITY METHODS
    // ========================================
    
    /**
     * Verifica se o usuário possui uma role específica
     */
    private boolean hasRole(User user, String roleName) {
        if (user == null || user.getRoles() == null || roleName == null) {
            return false;
        }
        
        return user.getRoles().stream()
                .anyMatch(role -> roleName.equals(role.getName()));
    }
    
    /**
     * Verifica se o usuário possui qualquer uma das roles especificadas
     */
    public boolean hasAnyRole(User user, String... roleNames) {
        if (user == null || roleNames == null || roleNames.length == 0) {
            return false;
        }
        
        for (String roleName : roleNames) {
            if (hasRole(user, roleName)) {
                return true;
            }
        }
        
        return false;
    }
    
    /**
     * Verifica se o usuário possui todas as roles especificadas
     */
    public boolean hasAllRoles(User user, String... roleNames) {
        if (user == null || roleNames == null || roleNames.length == 0) {
            return false;
        }
        
        for (String roleName : roleNames) {
            if (!hasRole(user, roleName)) {
                return false;
            }
        }
        
        return true;
    }
    
    /**
     * Valida se o usuário pode executar uma ação específica
     * Método genérico para validações futuras
     */
    public void validateUserPermission(User user, String action, Object resource, String resourceType) {
        if (user == null) {
            logger.error("Tentativa de ação {} sem usuário autenticado", action);
            auditLogService.logUnauthorizedAccess(null, action, null, "Usuário não autenticado");
            throw new AccessDeniedException("Usuário não autenticado");
        }
        
        // Log da tentativa de ação para auditoria
        String resourceId = resource != null ? resource.toString() : "N/A";
        logger.debug("Usuário {} tentando executar ação {} em {} (ID: {})", 
                    user.getEmail(), action, resourceType, resourceId);
        
        // Aqui podem ser adicionadas validações específicas conforme necessário
        auditLogService.logAttemptedAction(user, action, resourceId, resourceType);
    }
    
    /**
     * Lança exceção de acesso negado com log de auditoria
     */
    public void denyAccess(User user, String action, Object resourceId, String reason) {
        logger.warn("Acesso negado para usuário {} na ação {} ({})", 
                   user != null ? user.getEmail() : "null", action, reason);
        
        auditLogService.logUnauthorizedAccess(user, action, resourceId, reason);
        
        throw new AccessDeniedException("Acesso negado: " + reason);
    }
}