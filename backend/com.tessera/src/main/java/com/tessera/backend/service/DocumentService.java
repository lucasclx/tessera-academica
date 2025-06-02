package com.tessera.backend.service;

import com.tessera.backend.dto.DocumentDTO;
import com.tessera.backend.entity.*;
import com.tessera.backend.exception.ResourceNotFoundException;
import com.tessera.backend.exception.UnauthorizedOperationException;
import com.tessera.backend.repository.DocumentCollaboratorRepository;
import com.tessera.backend.repository.DocumentRepository;
import com.tessera.backend.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Set; // Import Set
import java.util.stream.Collectors;

@Service
public class DocumentService {

    private static final Logger logger = LoggerFactory.getLogger(DocumentService.class);

    @Autowired
    private DocumentRepository documentRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private DocumentCollaboratorRepository collaboratorRepository;

    @Autowired
    private NotificationEventService notificationEventService;

    // Método auxiliar para verificar papéis de forma segura para lambdas
    private boolean userHasRole(final User user, final String roleName) {
        if (user == null || user.getRoles() == null || roleName == null) {
            return false;
        }
        // Acessa as roles de 'user' que é final no contexto desta chamada.
        // A lambda 'r -> ...' opera sobre elementos da coleção de roles.
        return user.getRoles().stream().anyMatch(role -> roleName.equals(role.getName()));
    }

    @Transactional
    public DocumentDTO createDocument(DocumentDTO documentDTO, final User currentUser) {
        logger.info("Tentativa de criação de documento por {}: {}", currentUser.getEmail(), documentDTO.getTitle());

        Long tempTargetStudentId = documentDTO.getStudentId();
        if (tempTargetStudentId == null) {
            if (userHasRole(currentUser, "STUDENT")) { // Usando o método auxiliar
                tempTargetStudentId = currentUser.getId();
                logger.debug("Nenhum studentId fornecido por estudante {}, usando o ID do próprio usuário: {}", currentUser.getEmail(), tempTargetStudentId);
            } else {
                throw new IllegalArgumentException("studentId é obrigatório para criação de documento por não-estudantes.");
            }
        }
        // Garante que targetStudentId seja efetivamente final para a lambda do orElseThrow
        final Long finalTargetStudentId = tempTargetStudentId;

        final User student = userRepository.findById(finalTargetStudentId)
                .orElseThrow(() -> new ResourceNotFoundException("Estudante alvo não encontrado com ID: " + finalTargetStudentId));

        User advisor = userRepository.findById(documentDTO.getAdvisorId())
                .orElseThrow(() -> new ResourceNotFoundException("Orientador não encontrado com ID: " + documentDTO.getAdvisorId()));

        // Verificação de permissão: usuário atual deve ser o estudante do documento ou um ADMIN.
        boolean isAdmin = userHasRole(currentUser, "ADMIN"); // Usando o método auxiliar
        if (!currentUser.getId().equals(student.getId()) && !isAdmin) {
            logger.warn("Permissão negada: Usuário {} tentou criar documento para estudante {}", currentUser.getEmail(), student.getEmail());
            throw new UnauthorizedOperationException("Você não tem permissão para criar documentos para este estudante.");
        }

        Document document = new Document();
        document.setTitle(documentDTO.getTitle());
        document.setDescription(documentDTO.getDescription());
        document.setStudent(student);
        document.setAdvisor(advisor);
        document.setStatus(DocumentStatus.DRAFT);

        Document savedDocument = documentRepository.save(document);
        logger.info("Documento salvo com ID: {}", savedDocument.getId());

        createPrimaryCollaborators(savedDocument, student, advisor, currentUser);

        notificationEventService.onDocumentCreated(savedDocument, currentUser);
        logger.info("Notificação de criação de documento disparada para o documento ID: {}", savedDocument.getId());

        return mapToDTO(savedDocument);
    }

    private void createPrimaryCollaborators(Document document, User studentUser, User advisorUser, final User addedBy) {
        DocumentCollaborator studentCollaborator = new DocumentCollaborator();
        studentCollaborator.setDocument(document);
        studentCollaborator.setUser(studentUser);
        studentCollaborator.setRole(CollaboratorRole.PRIMARY_STUDENT);
        studentCollaborator.setPermission(CollaboratorPermission.FULL_ACCESS);
        studentCollaborator.setAddedBy(addedBy);
        studentCollaborator.setActive(true);
        studentCollaborator.setAddedAt(LocalDateTime.now());
        collaboratorRepository.save(studentCollaborator);
        logger.info("Colaborador Estudante Principal (ID: {}) adicionado ao Documento ID: {}", studentUser.getId(), document.getId());

        DocumentCollaborator advisorCollaborator = new DocumentCollaborator();
        advisorCollaborator.setDocument(document);
        advisorCollaborator.setUser(advisorUser);
        advisorCollaborator.setRole(CollaboratorRole.PRIMARY_ADVISOR);
        advisorCollaborator.setPermission(CollaboratorPermission.FULL_ACCESS);
        advisorCollaborator.setAddedBy(addedBy);
        advisorCollaborator.setActive(true);
        advisorCollaborator.setAddedAt(LocalDateTime.now());
        collaboratorRepository.save(advisorCollaborator);
        logger.info("Colaborador Orientador Principal (ID: {}) adicionado ao Documento ID: {}", advisorUser.getId(), document.getId());

        document.getCollaborators().add(studentCollaborator);
        document.getCollaborators().add(advisorCollaborator);
    }

    public DocumentDTO getDocument(Long id) {
        logger.debug("Buscando documento com ID: {}", id);
        Document document = documentRepository.findById(id)
                .orElseThrow(() -> {
                    logger.warn("Documento não encontrado com ID: {}", id);
                    return new ResourceNotFoundException("Documento não encontrado com ID: " + id);
                });
        return mapToDTO(document);
    }

    public Page<DocumentDTO> getDocumentsByCollaborator(final User user, String searchTerm, String statusFilter, Pageable pageable) {
        logger.debug("Buscando documentos para colaborador: {}, searchTerm: '{}', statusFilter: '{}', pageable: {}", user.getEmail(), searchTerm, statusFilter, pageable);
        DocumentStatus status = parseStatus(statusFilter);
        String trimmedSearchTerm = StringUtils.hasText(searchTerm) ? searchTerm.trim().toLowerCase() : null;

        Page<Document> documentsPage;
        if (status != null && trimmedSearchTerm != null) {
            documentsPage = documentRepository.findByCollaboratorWithSearchAndStatus(user, trimmedSearchTerm, status, pageable);
        } else if (status != null) {
            documentsPage = documentRepository.findByCollaboratorAndStatus(user, status, pageable);
        } else if (trimmedSearchTerm != null) {
            documentsPage = documentRepository.findByCollaboratorWithSearch(user, trimmedSearchTerm, pageable);
        } else {
            documentsPage = documentRepository.findByCollaborator(user, pageable);
        }
        logger.info("Encontrados {} documentos para {} na página {}", documentsPage.getNumberOfElements(), user.getEmail(), pageable.getPageNumber());
        return documentsPage.map(this::mapToDTO);
    }

    @Transactional
    public DocumentDTO updateDocument(Long id, DocumentDTO documentDTO, final User currentUser) {
        logger.info("Tentativa de atualização do documento ID {} por {}", id, currentUser.getEmail());
        final Document document = documentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Documento não encontrado com ID: " + id));

        if (!document.canUserEdit(currentUser)) {
             logger.warn("Permissão negada: Usuário {} tentou editar documento ID {} sem permissão de edição de info.", currentUser.getEmail(), id);
             throw new UnauthorizedOperationException("Você não tem permissão para editar as informações deste documento.");
        }

        boolean updated = false;
        if (StringUtils.hasText(documentDTO.getTitle()) && !documentDTO.getTitle().equals(document.getTitle())) {
            document.setTitle(documentDTO.getTitle());
            updated = true;
        }
        if (documentDTO.getDescription() != null && !documentDTO.getDescription().equals(document.getDescription())) {
            document.setDescription(documentDTO.getDescription());
            updated = true;
        }

        if (documentDTO.getAdvisorId() != null && (document.getPrimaryAdvisor() == null || !documentDTO.getAdvisorId().equals(document.getPrimaryAdvisor().getId()))) {
            User newAdvisor = userRepository.findById(documentDTO.getAdvisorId())
                    .orElseThrow(() -> new ResourceNotFoundException("Novo orientador não encontrado com ID: " + documentDTO.getAdvisorId()));

            DocumentCollaborator currentPrimaryAdvisorCollab = document.getCollaborators().stream()
                .filter(c -> c.isActive() && c.getRole() == CollaboratorRole.PRIMARY_ADVISOR)
                .findFirst().orElse(null);

            if (currentPrimaryAdvisorCollab != null && !currentPrimaryAdvisorCollab.getUser().getId().equals(newAdvisor.getId())) {
                currentPrimaryAdvisorCollab.setRole(CollaboratorRole.SECONDARY_ADVISOR);
                collaboratorRepository.save(currentPrimaryAdvisorCollab);
            }
            
            DocumentCollaborator newPrimaryAdvisorCollab = document.getCollaborators().stream()
                .filter(c -> c.getUser().getId().equals(newAdvisor.getId()) && c.isActive())
                .findFirst().orElseGet(() -> {
                    DocumentCollaborator newCollab = new DocumentCollaborator();
                    newCollab.setDocument(document);
                    newCollab.setUser(newAdvisor);
                    newCollab.setAddedBy(currentUser);
                    newCollab.setAddedAt(LocalDateTime.now());
                    newCollab.setActive(true);
                    document.getCollaborators().add(newCollab);
                    return newCollab;
                });
            
            newPrimaryAdvisorCollab.setRole(CollaboratorRole.PRIMARY_ADVISOR);
            newPrimaryAdvisorCollab.setPermission(CollaboratorPermission.FULL_ACCESS);
            collaboratorRepository.save(newPrimaryAdvisorCollab);

            document.setAdvisor(newAdvisor);
            updated = true;
            logger.info("Orientador principal do Documento ID {} alterado para {}", id, newAdvisor.getEmail());
        }

        if (updated) {
            document.setUpdatedAt(LocalDateTime.now());
            logger.info("Documento ID {} atualizado.", id);
        }
        return mapToDTO(documentRepository.save(document));
    }

    @Transactional
    public DocumentDTO changeStatus(Long id, DocumentStatus newStatus, final User currentUser, String reason) {
        logger.info("Tentativa de mudança de status para {} no Documento ID {} por {}", newStatus, id, currentUser.getEmail());
        final Document document = documentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Documento não encontrado com ID: " + id));

        DocumentStatus oldStatus = document.getStatus();

        switch (newStatus) {
            case SUBMITTED:
                if (oldStatus != DocumentStatus.DRAFT && oldStatus != DocumentStatus.REVISION) {
                    throw new IllegalStateException("Documento só pode ser submetido se estiver em Rascunho ou Revisão.");
                }
                if (!document.canUserSubmitDocument(currentUser)){
                    throw new UnauthorizedOperationException("Apenas colaboradores estudantes podem submeter o documento.");
                }
                document.setSubmittedAt(LocalDateTime.now());
                document.setRejectionReason(null);
                document.setRejectedAt(null);
                document.setApprovedAt(null);
                break;
            case REVISION:
                if (oldStatus != DocumentStatus.SUBMITTED) {
                    throw new IllegalStateException("Documento só pode ser enviado para revisão se estiver Submetido.");
                }
                 if (!document.canUserApproveDocument(currentUser)){
                    throw new UnauthorizedOperationException("Apenas colaboradores orientadores podem solicitar revisão.");
                }
                if (!StringUtils.hasText(reason)) {
                    throw new IllegalArgumentException("Um motivo é obrigatório para solicitar revisão.");
                }
                document.setRejectionReason(reason);
                document.setRejectedAt(LocalDateTime.now());
                break;
            case APPROVED:
                if (oldStatus != DocumentStatus.SUBMITTED && oldStatus != DocumentStatus.REVISION) {
                    throw new IllegalStateException("Documento só pode ser aprovado se estiver Submetido ou em Revisão.");
                }
                 if (!document.canUserApproveDocument(currentUser)){
                    throw new UnauthorizedOperationException("Apenas colaboradores orientadores podem aprovar o documento.");
                }
                document.setApprovedAt(LocalDateTime.now());
                document.setRejectionReason(null);
                document.setRejectedAt(null);
                break;
            case FINALIZED:
                if (oldStatus != DocumentStatus.APPROVED) {
                    throw new IllegalStateException("O documento deve ser Aprovado antes de ser Finalizado.");
                }
                if (!document.canUserEdit(currentUser) && !document.canUserManageCollaborators(currentUser)){
                     throw new UnauthorizedOperationException("Você não tem permissão para finalizar este documento.");
                }
                break;
            case DRAFT: 
                if (oldStatus == DocumentStatus.FINALIZED && !userHasRole(currentUser, "ADMIN")) { // Usando o método auxiliar
                     throw new UnauthorizedOperationException("Apenas admins podem reverter um documento Finalizado para Rascunho.");
                }
                if (!document.canUserEdit(currentUser) && !document.canUserManageCollaborators(currentUser)){
                     throw new UnauthorizedOperationException("Você não tem permissão para reverter este documento para rascunho.");
                }
                document.setSubmittedAt(null);
                document.setApprovedAt(null);
                document.setRejectedAt(null);
                document.setRejectionReason(null);
                break;
            default:
                 throw new IllegalArgumentException("Novo status desconhecido ou transição não permitida: " + newStatus);
        }

        document.setStatus(newStatus);
        document.setUpdatedAt(LocalDateTime.now());
        Document savedDocument = documentRepository.save(document);

        if (oldStatus != newStatus) {
            notificationEventService.onDocumentStatusChanged(savedDocument, oldStatus, currentUser);
        }
        logger.info("Status do Documento ID {} alterado de {} para {} por {}", id, oldStatus, newStatus, currentUser.getEmail());
        return mapToDTO(savedDocument);
    }

    @Transactional
    public void deleteDocument(Long id, final User currentUser) {
        logger.info("Tentativa de exclusão do Documento ID {} por {}", id, currentUser.getEmail());
        final Document document = documentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Documento não encontrado com ID: " + id));

        // As variáveis isPrimaryStudent e isAdmin são usadas APÓS as lambdas que as definem.
        // A captura de 'currentUser' pelas lambdas é o que importa.
        boolean isPrimaryStudent = document.getCollaborator(currentUser)
                .map(c -> c.getRole() == CollaboratorRole.PRIMARY_STUDENT && c.isActive())
                .orElse(false);
        
        boolean isAdmin = userHasRole(currentUser, "ADMIN"); // Usando o método auxiliar

        if (!isAdmin && !isPrimaryStudent) {
            logger.warn("Permissão negada: Usuário {} tentou excluir Documento ID {} sem ser admin ou estudante principal.", currentUser.getEmail(), id);
            throw new UnauthorizedOperationException("Apenas o estudante principal ou administrador podem excluir documentos.");
        }

        if (document.getStatus() != DocumentStatus.DRAFT && !isAdmin) { 
            logger.warn("Tentativa de exclusão de Documento ID {} que não está em DRAFT por {}", id, currentUser.getEmail());
            throw new IllegalStateException("Apenas documentos em rascunho podem ser excluídos por estudantes.");
        }
        
        documentRepository.delete(document);
        logger.info("Documento ID {} excluído com sucesso por {}", id, currentUser.getEmail());
    }

    private DocumentStatus parseStatus(String statusFilter) {
        if (!StringUtils.hasText(statusFilter) || statusFilter.equalsIgnoreCase("ALL")) {
            return null;
        }
        try {
            return DocumentStatus.valueOf(statusFilter.toUpperCase());
        } catch (IllegalArgumentException e) {
            logger.warn("Status de filtro inválido recebido: {}", statusFilter);
            return null;
        }
    }

    private DocumentDTO mapToDTO(Document document) {
        DocumentDTO dto = new DocumentDTO();
        dto.setId(document.getId());
        dto.setTitle(document.getTitle());
        dto.setDescription(document.getDescription());
        dto.setStatus(document.getStatus());

        User primaryStudent = document.getPrimaryStudent();
        if (primaryStudent != null) {
            dto.setStudentId(primaryStudent.getId());
            dto.setStudentName(primaryStudent.getName());
        } else if (document.getStudent() != null) {
            dto.setStudentId(document.getStudent().getId());
            dto.setStudentName(document.getStudent().getName());
        }

        User primaryAdvisor = document.getPrimaryAdvisor();
        if (primaryAdvisor != null) {
            dto.setAdvisorId(primaryAdvisor.getId());
            dto.setAdvisorName(primaryAdvisor.getName());
        } else if (document.getAdvisor() != null) {
            dto.setAdvisorId(document.getAdvisor().getId());
            dto.setAdvisorName(document.getAdvisor().getName());
        }
        
        dto.setCreatedAt(document.getCreatedAt());
        dto.setUpdatedAt(document.getUpdatedAt());
        dto.setSubmittedAt(document.getSubmittedAt());
        dto.setApprovedAt(document.getApprovedAt());
        dto.setRejectedAt(document.getRejectedAt());
        dto.setRejectionReason(document.getRejectionReason());
        dto.setVersionCount(document.getVersions() != null ? document.getVersions().size() : 0);

        return dto;
    }
}