package com.tessera.backend.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import com.tessera.backend.entity.Comment;
import com.tessera.backend.entity.Document;
import com.tessera.backend.entity.DocumentStatus;
import com.tessera.backend.entity.NotificationPriority;
import com.tessera.backend.entity.NotificationType;
import com.tessera.backend.entity.User;
import com.tessera.backend.entity.Version;

@Service
public class NotificationEventService {

    @Autowired
    private NotificationService notificationService;

    // Eventos de documento
    public void onDocumentCreated(Document document, User creator) {
        // Notificar orientador
        if (document.getAdvisor() != null && !document.getAdvisor().equals(creator)) {
            notificationService.createNotification(
                document.getAdvisor(),
                NotificationType.DOCUMENT_CREATED,
                "Nova monografia criada",
                String.format("O estudante %s criou uma nova monografia: '%s'", 
                             creator.getName(), document.getTitle()),
                creator,
                document.getId(),
                "document",
                "/advisor/documents/" + document.getId(),
                NotificationPriority.NORMAL,
                null
            );
        }
    }

    public void onDocumentSubmitted(Document document, User submitter) {
        // Notificar orientador
        if (document.getAdvisor() != null) {
            notificationService.createNotification(
                document.getAdvisor(),
                NotificationType.DOCUMENT_SUBMITTED,
                "Documento submetido para revisão",
                String.format("O estudante %s submeteu o documento '%s' para sua revisão", 
                             submitter.getName(), document.getTitle()),
                submitter,
                document.getId(),
                "document",
                "/advisor/documents/" + document.getId() + "/review",
                NotificationPriority.HIGH,
                null
            );
        }
    }

    public void onDocumentStatusChanged(Document document, DocumentStatus oldStatus, User changedBy) {
        User targetUser = null;
        NotificationType type = null;
        String title = null;
        String message = null;
        NotificationPriority priority = NotificationPriority.NORMAL;

        switch (document.getStatus()) {
            case APPROVED:
                targetUser = document.getStudent();
                type = NotificationType.DOCUMENT_APPROVED;
                title = "Documento aprovado!";
                message = String.format("Seu documento '%s' foi aprovado pelo orientador %s", 
                                      document.getTitle(), document.getAdvisor().getName());
                priority = NotificationPriority.HIGH;
                break;
                
            case REVISION:
                targetUser = document.getStudent();
                type = NotificationType.DOCUMENT_REVISION_REQUESTED;
                title = "Revisão solicitada";
                message = String.format("O orientador %s solicitou revisões no documento '%s'", 
                                      document.getAdvisor().getName(), document.getTitle());
                priority = NotificationPriority.HIGH;
                break;
                
            case FINALIZED:
                // Notificar ambos
                notificationService.createNotification(
                    document.getStudent(),
                    NotificationType.DOCUMENT_FINALIZED,
                    "Documento finalizado",
                    String.format("O documento '%s' foi finalizado com sucesso!", document.getTitle()),
                    changedBy,
                    document.getId(),
                    "document",
                    "/student/documents/" + document.getId(),
                    NotificationPriority.HIGH,
                    null
                );
                
                if (!document.getAdvisor().equals(changedBy)) {
                    notificationService.createNotification(
                        document.getAdvisor(),
                        NotificationType.DOCUMENT_FINALIZED,
                        "Documento finalizado",
                        String.format("O documento '%s' foi finalizado", document.getTitle()),
                        changedBy,
                        document.getId(),
                        "document",
                        "/advisor/documents/" + document.getId(),
                        NotificationPriority.NORMAL,
                        null
                    );
                }
                return;
        }

        if (targetUser != null && type != null) {
            String actionUrl = targetUser.equals(document.getStudent()) ? 
                "/student/documents/" + document.getId() : 
                "/advisor/documents/" + document.getId();
                
            notificationService.createNotification(
                targetUser, type, title, message, changedBy,
                document.getId(), "document", actionUrl, priority, null
            );
        }
    }

    // Eventos de versão
    public void onVersionCreated(Version version, User creator) {
        Document document = version.getDocument();
        
        // Notificar o outro participante (orientador ou estudante)
        User targetUser = creator.equals(document.getStudent()) ? 
                         document.getAdvisor() : document.getStudent();
                         
        if (targetUser != null) {
            String actionUrl = targetUser.equals(document.getStudent()) ? 
                "/student/documents/" + document.getId() : 
                "/advisor/documents/" + document.getId();
                
            notificationService.createNotification(
                targetUser,
                NotificationType.VERSION_CREATED,
                "Nova versão disponível",
                String.format("%s criou uma nova versão (%s) do documento '%s': %s", 
                             creator.getName(), version.getVersionNumber(), 
                             document.getTitle(), version.getCommitMessage()),
                creator,
                version.getId(),
                "version",
                actionUrl,
                NotificationPriority.NORMAL,
                null
            );
        }
    }

    // Eventos de comentário
    public void onCommentAdded(Comment comment, User commenter) {
        Document document = comment.getVersion().getDocument();
        
        // Notificar o outro participante
        User targetUser = commenter.equals(document.getStudent()) ? 
                         document.getAdvisor() : document.getStudent();
                         
        if (targetUser != null) {
            String actionUrl = targetUser.equals(document.getStudent()) ? 
                "/student/documents/" + document.getId() : 
                "/advisor/documents/" + document.getId();
                
            notificationService.createNotification(
                targetUser,
                NotificationType.COMMENT_ADDED,
                "Novo comentário adicionado",
                String.format("%s adicionou um comentário na versão %s do documento '%s'", 
                             commenter.getName(), comment.getVersion().getVersionNumber(), 
                             document.getTitle()),
                commenter,
                comment.getId(),
                "comment",
                actionUrl,
                NotificationPriority.NORMAL,
                null
            );
        }
    }

    public void onCommentResolved(Comment comment, User resolver) {
        Document document = comment.getVersion().getDocument();
        
        // Notificar o autor original do comentário se não foi ele quem resolveu
        if (!resolver.equals(comment.getUser())) {
            String actionUrl = comment.getUser().equals(document.getStudent()) ? 
                "/student/documents/" + document.getId() : 
                "/advisor/documents/" + document.getId();
                
            notificationService.createNotification(
                comment.getUser(),
                NotificationType.COMMENT_RESOLVED,
                "Comentário resolvido",
                String.format("%s marcou seu comentário como resolvido no documento '%s'", 
                             resolver.getName(), document.getTitle()),
                resolver,
                comment.getId(),
                "comment",
                actionUrl,
                NotificationPriority.LOW,
                null
            );
        }
    }

    // Eventos de usuário
    public void onUserRegistered(User newUser) {
        // Notificar todos os admins
        // Este método seria chamado pelo AuthService após registro
        // Implementação seria feita em conjunto com o AuthService
    }

    public void onUserApproved(User approvedUser, User admin) {
        notificationService.createNotification(
            approvedUser,
            NotificationType.USER_APPROVED,
            "Conta aprovada!",
            "Sua conta foi aprovada e você já pode usar todas as funcionalidades da plataforma",
            admin,
            approvedUser.getId(),
            "user",
            "/dashboard",
            NotificationPriority.HIGH,
            null
        );
    }

    public void onUserRejected(User rejectedUser, User admin, String reason) {
        notificationService.createNotification(
            rejectedUser,
            NotificationType.USER_REJECTED,
            "Solicitação de conta rejeitada",
            String.format("Sua solicitação de conta foi rejeitada. Motivo: %s", reason),
            admin,
            rejectedUser.getId(),
            "user",
            "/login",
            NotificationPriority.HIGH,
            null
        );
    }
}