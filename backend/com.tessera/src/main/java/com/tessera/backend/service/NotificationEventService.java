package com.tessera.backend.service;

import com.tessera.backend.entity.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.List;

@Service
public class NotificationEventService {

    private static final Logger logger = LoggerFactory.getLogger(NotificationEventService.class);
    
    @Autowired(required = false)
    private NotificationService notificationService;
    
    // =====================================================================
    // MÉTODOS PARA DOCUMENTOS
    // =====================================================================
    
    public void onDocumentCreated(Document document, User creator) {
        // Notificar orientador principal
        User advisor = document.getPrimaryAdvisor();
        if (advisor != null && !advisor.equals(creator)) {
            sendNotification(
                advisor,
                "Nova monografia criada",
                String.format("O estudante %s criou uma nova monografia: '%s'",
                             creator.getName(), document.getTitle()),
                "DOCUMENT_CREATED"
            );
        }
        
        logger.info("Documento criado: {} por {}", document.getTitle(), creator.getName());
    }

    public void onDocumentSubmitted(Document document, User submitter) {
        // Notificar orientador principal
        User primaryAdvisor = document.getPrimaryAdvisor();
        if (primaryAdvisor != null) {
            sendNotification(
                primaryAdvisor,
                "Documento submetido para revisão",
                String.format("O estudante %s submeteu o documento '%s' para sua revisão", 
                             submitter.getName(), document.getTitle()),
                "DOCUMENT_SUBMITTED"
            );
        }
        
        // Notificar todos os orientadores se houver múltiplos
        List<User> advisors = document.getAllAdvisors();
        for (User advisor : advisors) {
            if (!advisor.equals(primaryAdvisor)) {
                sendNotification(advisor, "Documento submetido para aprovação", 
                               "O documento '" + document.getTitle() + "' foi submetido por " + submitter.getName(),
                               "DOCUMENT_SUBMITTED");
            }
        }
    }

    public void onDocumentStatusChanged(Document document, DocumentStatus oldStatus, User changedBy) {
        String title = "";
        String message = "";
        String notificationType = "";
        
        switch (document.getStatus()) {
            case APPROVED:
                title = "Documento aprovado!";
                message = String.format("Seu documento '%s' foi aprovado pelo orientador %s", 
                                      document.getTitle(), changedBy.getName());
                notificationType = "DOCUMENT_APPROVED";
                break;
                
            case REVISION:
                title = "Revisão solicitada";
                message = String.format("O orientador %s solicitou revisões no documento '%s'", 
                                      changedBy.getName(), document.getTitle());
                notificationType = "DOCUMENT_REVISION_REQUESTED";
                break;
                
            case FINALIZED:
                title = "Documento finalizado";
                message = String.format("O documento '%s' foi finalizado com sucesso!", document.getTitle());
                notificationType = "DOCUMENT_FINALIZED";
                break;
                
            default:
                title = "Status do documento alterado";
                message = String.format("O documento '%s' mudou de %s para %s", 
                                       document.getTitle(), oldStatus, document.getStatus());
                notificationType = "DOCUMENT_STATUS_CHANGED";
        }
        
        // Notificar estudantes sobre mudanças de status
        List<User> students = document.getAllStudents();
        for (User student : students) {
            if (!student.getId().equals(changedBy.getId())) {
                sendNotification(student, title, message, notificationType);
            }
        }
        
        // Para documentos finalizados, notificar também orientadores
        if (document.getStatus() == DocumentStatus.FINALIZED) {
            List<User> advisors = document.getAllAdvisors();
            for (User advisor : advisors) {
                if (!advisor.getId().equals(changedBy.getId())) {
                    sendNotification(advisor, title, 
                                   "O documento '" + document.getTitle() + "' foi finalizado", 
                                   notificationType);
                }
            }
        }
    }
    
    // =====================================================================
    // MÉTODOS PARA VERSÕES
    // =====================================================================
    
    public void onVersionCreated(Version version, User creator) {
        Document document = version.getDocument();
        
        // Notificar todos os colaboradores exceto o criador
        List<User> allCollaborators = document.getAllStudents();
        allCollaborators.addAll(document.getAllAdvisors());
        
        for (User collaborator : allCollaborators) {
            if (!collaborator.getId().equals(creator.getId())) {
                sendNotification(
                    collaborator,
                    "Nova versão disponível",
                    String.format("%s criou uma nova versão (%s) do documento '%s': %s", 
                                 creator.getName(), version.getVersionNumber(), 
                                 document.getTitle(), version.getCommitMessage()),
                    "VERSION_CREATED"
                );
            }
        }
    }
    
    // =====================================================================
    // MÉTODOS PARA COMENTÁRIOS
    // =====================================================================
    
    public void onCommentAdded(Comment comment, User commenter) {
        Document document = comment.getVersion().getDocument();
        
        // Notificar todos os colaboradores exceto o comentarista
        List<User> allCollaborators = document.getAllStudents();
        allCollaborators.addAll(document.getAllAdvisors());
        
        for (User collaborator : allCollaborators) {
            if (!collaborator.getId().equals(commenter.getId())) {
                sendNotification(
                    collaborator,
                    "Novo comentário adicionado",
                    String.format("%s adicionou um comentário na versão %s do documento '%s'", 
                                 commenter.getName(), comment.getVersion().getVersionNumber(), 
                                 document.getTitle()),
                    "COMMENT_ADDED"
                );
            }
        }
    }

    public void onCommentResolved(Comment comment, User resolver) {
        Document document = comment.getVersion().getDocument();
        
        // Notificar o autor original do comentário se não foi ele quem resolveu
        if (!resolver.equals(comment.getUser())) {
            sendNotification(
                comment.getUser(),
                "Comentário resolvido",
                String.format("%s marcou seu comentário como resolvido no documento '%s'", 
                             resolver.getName(), document.getTitle()),
                "COMMENT_RESOLVED"
            );
        }
        
        // Notificar outros colaboradores interessados
        List<User> allCollaborators = document.getAllStudents();
        allCollaborators.addAll(document.getAllAdvisors());
        
        for (User collaborator : allCollaborators) {
            if (!collaborator.getId().equals(resolver.getId()) && 
                !collaborator.getId().equals(comment.getUser().getId())) {
                sendNotification(
                    collaborator,
                    "Comentário resolvido",
                    String.format("Um comentário foi resolvido no documento '%s'", document.getTitle()),
                    "COMMENT_RESOLVED"
                );
            }
        }
    }
    
    // =====================================================================
    // MÉTODOS PARA COLABORADORES
    // =====================================================================
    
    public void onCollaboratorAdded(Document document, User newCollaborator, User addedBy, CollaboratorRole role) {
        // Notificar o novo colaborador
        sendNotification(
            newCollaborator, 
            "Você foi adicionado como colaborador", 
            String.format("Você foi adicionado como %s no documento '%s' por %s", 
                         role.getDisplayName(), document.getTitle(), addedBy.getName()),
            "COLLABORATOR_ADDED"
        );
        
        // Notificar outros colaboradores principais
        document.getCollaborators().stream()
                .filter(c -> c.isActive() && c.getRole().isPrimary() && 
                            !c.getUser().getId().equals(addedBy.getId()) &&
                            !c.getUser().getId().equals(newCollaborator.getId()))
                .forEach(c -> sendNotification(
                    c.getUser(), 
                    "Novo colaborador adicionado", 
                    String.format("%s foi adicionado como %s no documento '%s'", 
                                 newCollaborator.getName(), role.getDisplayName(), document.getTitle()),
                    "COLLABORATOR_ADDED"
                ));
    }
    
    public void onCollaboratorRemoved(Document document, User removedCollaborator, User removedBy) {
        // Notificar o colaborador removido
        sendNotification(
            removedCollaborator, 
            "Você foi removido como colaborador", 
            String.format("Você foi removido do documento '%s' por %s", 
                         document.getTitle(), removedBy.getName()),
            "COLLABORATOR_REMOVED"
        );
        
        // Notificar outros colaboradores principais
        document.getCollaborators().stream()
                .filter(c -> c.isActive() && c.getRole().isPrimary() && 
                            !c.getUser().getId().equals(removedBy.getId()))
                .forEach(c -> sendNotification(
                    c.getUser(), 
                    "Colaborador removido", 
                    String.format("%s foi removido do documento '%s'", 
                                 removedCollaborator.getName(), document.getTitle()),
                    "COLLABORATOR_REMOVED"
                ));
    }
    
    public void onCollaboratorRoleChanged(Document document, User collaborator, 
                                        CollaboratorRole oldRole, CollaboratorRole newRole, User changedBy) {
        // Notificar o colaborador sobre mudança de papel
        sendNotification(
            collaborator, 
            "Seu papel foi alterado", 
            String.format("Seu papel no documento '%s' foi alterado de %s para %s por %s", 
                         document.getTitle(), oldRole.getDisplayName(), 
                         newRole.getDisplayName(), changedBy.getName()),
            "COLLABORATOR_ROLE_CHANGED"
        );
        
        // Notificar outros colaboradores principais
        document.getCollaborators().stream()
                .filter(c -> c.isActive() && c.getRole().isPrimary() && 
                            !c.getUser().getId().equals(changedBy.getId()) &&
                            !c.getUser().getId().equals(collaborator.getId()))
                .forEach(c -> sendNotification(
                    c.getUser(), 
                    "Papel de colaborador alterado", 
                    String.format("O papel de %s foi alterado de %s para %s no documento '%s'", 
                                 collaborator.getName(), oldRole.getDisplayName(), 
                                 newRole.getDisplayName(), document.getTitle()),
                    "COLLABORATOR_ROLE_CHANGED"
                ));
    }
    
    // =====================================================================
    // MÉTODOS PARA USUÁRIOS (ADMIN)
    // =====================================================================
    
    public void onUserRegistered(User newUser) {
        logger.info("Novo usuário registrado: {}", newUser.getEmail());
        // Implementar notificação para admins se necessário
    }

    public void onUserApproved(User approvedUser, User admin) {
        sendNotification(
            approvedUser,
            "Conta aprovada!",
            "Sua conta foi aprovada e você já pode usar todas as funcionalidades da plataforma",
            "USER_APPROVED"
        );
    }

    public void onUserRejected(User rejectedUser, User admin, String reason) {
        sendNotification(
            rejectedUser,
            "Solicitação de conta rejeitada",
            String.format("Sua solicitação de conta foi rejeitada. Motivo: %s", reason),
            "USER_REJECTED"
        );
    }
    
    // =====================================================================
    // MÉTODO AUXILIAR PARA ENVIO DE NOTIFICAÇÕES
    // =====================================================================
    
    private void sendNotification(User user, String title, String message, String type) {
        // Log simples para debug
        logger.debug("NOTIFICAÇÃO [{}] para {}: {} - {}", type, user.getEmail(), title, message);

        // Se o NotificationService estiver disponível, usar ele
        if (notificationService != null) {
            try {
                NotificationType notificationType = NotificationType.valueOf(type);
                notificationService.createNotification(user, notificationType, title, message, null, null, null, null);
            } catch (Exception e) {
                System.err.println("Erro ao enviar notificação: " + e.getMessage());
            }
        }
        
        // Implementar outros canais de notificação aqui:
        // - Email
        // - Push notifications
        // - WebSocket
        // - SMS
        // etc.
    }
}