package com.tessera.backend.service;

import com.tessera.backend.dto.DocumentDTO;
import com.tessera.backend.dto.DocumentDetailDTO;
import com.tessera.backend.dto.DocumentCollaboratorDTO;
import com.tessera.backend.dto.UserSelectionDTO;
import com.tessera.backend.dto.VersionDTO;
import com.tessera.backend.entity.*;
import com.tessera.backend.exception.ResourceNotFoundException;
import com.tessera.backend.exception.PermissionDeniedException;
import com.tessera.backend.repository.DocumentCollaboratorRepository;
import com.tessera.backend.exception.BusinessRuleException;
import com.tessera.backend.repository.DocumentRepository;
import com.tessera.backend.repository.UserRepository;
import com.tessera.backend.repository.VersionRepository;
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
import java.util.Map;
import java.util.Objects;
import java.util.HashMap;
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
    private VersionRepository versionRepository;

    @Autowired
    private NotificationEventService notificationEventService;

    @Autowired
    private EditingSessionService editingSessionService;

    @Autowired
    private VersionService versionService;


    private boolean userHasRole(final User user, final String roleName) {
        if (user == null || user.getRoles() == null || roleName == null) {
            return false;
        }
        return user.getRoles().stream().anyMatch(role -> roleName.equals(role.getName()));
    }

    @Transactional
    public DocumentDTO createDocument(DocumentDTO documentDTO, final User currentUser) {
        logger.info("Tentativa de criação de documento por {}: {}", currentUser.getEmail(), documentDTO.getTitle());

        if (!userHasRole(currentUser, "STUDENT")) {
            throw new IllegalArgumentException("Apenas estudantes podem criar documentos diretamente.");
        }
        final User student = currentUser;
        User advisor = null;



        Document document = new Document();
        document.setTitle(documentDTO.getTitle());
        document.setDescription(documentDTO.getDescription());
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

        DocumentCollaborator advisorCollaborator = null;
        if (advisorUser != null) {
            advisorCollaborator = new DocumentCollaborator();
            advisorCollaborator.setDocument(document);
            advisorCollaborator.setUser(advisorUser);
            advisorCollaborator.setRole(CollaboratorRole.PRIMARY_ADVISOR);
            advisorCollaborator.setPermission(CollaboratorPermission.FULL_ACCESS);
            advisorCollaborator.setAddedBy(addedBy);
            advisorCollaborator.setActive(true);
            advisorCollaborator.setAddedAt(LocalDateTime.now());
            collaboratorRepository.save(advisorCollaborator);
            logger.info("Colaborador Orientador Principal (ID: {}) adicionado ao Documento ID: {}", advisorUser.getId(), document.getId());
        }

        document.getCollaborators().add(studentCollaborator);
        if (advisorCollaborator != null) {
            document.getCollaborators().add(advisorCollaborator);
        }

        documentRepository.save(document);
    }

    @Transactional(readOnly = true)
    public DocumentDTO getDocument(Long id) {
        logger.debug("Buscando documento com ID: {}", id);
        Document document = documentRepository.findById(id)
                .orElseThrow(() -> {
                    logger.warn("Documento não encontrado com ID: {}", id);
                    return new ResourceNotFoundException("Documento não encontrado com ID: " + id);
                });
        return mapToDTO(document);
    }

    @Transactional(readOnly = true)
    public DocumentDetailDTO getDocumentDetail(Long id, User currentUser) {
        logger.debug("Buscando detalhes do documento com ID: {}", id);
        Document document = documentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Documento não encontrado com ID: " + id));
        return mapToDetailDTO(document, currentUser);
    }

    @Transactional(readOnly = true)
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
        
        List<Long> ids = documentsPage.getContent().stream()
                .map(Document::getId)
                .toList();
        Map<Long, Integer> versionCounts = new HashMap<>();
        if (!ids.isEmpty()) {
            documentRepository.getVersionCounts(ids).forEach(obj -> {
                Long id = (Long) obj[0];
                Long count = (Long) obj[1];
                versionCounts.put(id, count.intValue());
            });
        }

        return documentsPage.map(d -> mapToDTO(d, versionCounts.get(d.getId())));
    }

    @Transactional(readOnly = true)
    public Page<DocumentDTO> getAllDocuments(String searchTerm, String statusFilter, Pageable pageable) {
        logger.debug("Listando todos os documentos, searchTerm: '{}', statusFilter: '{}', pageable: {}", searchTerm, statusFilter, pageable);
        DocumentStatus status = parseStatus(statusFilter);
        String trimmedSearchTerm = StringUtils.hasText(searchTerm) ? searchTerm.trim().toLowerCase() : null;

        Page<Document> documentsPage;
        if (trimmedSearchTerm != null) {
            documentsPage = documentRepository.findAllWithFilters(trimmedSearchTerm, status, pageable);
        } else if (status != null) {
            documentsPage = documentRepository.findAllByStatus(status, pageable);
        } else {
            documentsPage = documentRepository.findAll(pageable);
        }
        logger.info("Encontrados {} documentos na página {}", documentsPage.getNumberOfElements(), pageable.getPageNumber());

        List<Long> ids = documentsPage.getContent().stream()
                .map(Document::getId)
                .toList();
        Map<Long, Integer> versionCounts = new HashMap<>();
        if (!ids.isEmpty()) {
            documentRepository.getVersionCounts(ids).forEach(obj -> {
                Long id = (Long) obj[0];
                Long count = (Long) obj[1];
                versionCounts.put(id, count.intValue());
            });
        }

        return documentsPage.map(d -> mapToDTO(d, versionCounts.get(d.getId())));
    }

    @Transactional
    public DocumentDTO updateDocument(Long id, DocumentDTO documentDTO, final User currentUser) {
        logger.info("Tentativa de atualização do documento ID {} por {}", id, currentUser.getEmail());
        final Document document = documentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Documento não encontrado com ID: " + id));

        if (!document.canUserEdit(currentUser)) {
             logger.warn("Permissão negada: Usuário {} tentou editar documento ID {} sem permissão de edição de info.", currentUser.getEmail(), id);
             throw new PermissionDeniedException("Você não tem permissão para editar as informações deste documento.");
        }
        if (editingSessionService.hasOtherEditors(id, currentUser.getId())) {
            throw new BusinessRuleException("Outro usuário está editando este documento.");
        }

        boolean updated = false;
        if (StringUtils.hasText(documentDTO.getTitle()) && !Objects.equals(documentDTO.getTitle(), document.getTitle())) {
            document.setTitle(documentDTO.getTitle());
            updated = true;
        }
        if (!Objects.equals(documentDTO.getDescription(), document.getDescription())) {
            document.setDescription(documentDTO.getDescription());
            updated = true;
        }

        if (updated) {
            document.setUpdatedAt(LocalDateTime.now());
            Document savedDocument = documentRepository.save(document);
            
            logger.info("Documento ID {} atualizado. Criando nova versão para registrar a alteração de metadados.", id);
            
            Version latestVersion = versionRepository.findLatestByDocument(savedDocument).orElse(null);
            
            VersionDTO newVersionDto = new VersionDTO();
            newVersionDto.setDocumentId(savedDocument.getId());
            newVersionDto.setCommitMessage("Metadados do documento atualizados.");
            newVersionDto.setContent(latestVersion != null ? latestVersion.getContent() : "");

            versionService.createVersion(newVersionDto, currentUser);
            
            return mapToDTO(savedDocument);
        }

        return mapToDTO(document);
    }
    
    @Transactional
    public DocumentDTO changeStatus(Long id, DocumentStatus newStatus, final User currentUser, String reason) {
        logger.info("Tentativa de mudança de status para {} no Documento ID {} por {}", newStatus, id, currentUser.getEmail());
        final Document document = documentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Documento não encontrado com ID: " + id));

        DocumentStatus oldStatus = document.getStatus();

        boolean canChange = false;
        switch (newStatus) {
            case SUBMITTED:
                if ((oldStatus == DocumentStatus.DRAFT || oldStatus == DocumentStatus.REVISION) && document.canUserSubmitDocument(currentUser)) {
                    canChange = true;
                    document.setSubmittedAt(LocalDateTime.now());
                    document.setRejectionReason(null); 
                    document.setRejectedAt(null);
                    document.setApprovedAt(null); 
                } else if (!(oldStatus == DocumentStatus.DRAFT || oldStatus == DocumentStatus.REVISION)) {
                    throw new IllegalStateException("Documento só pode ser submetido se estiver em Rascunho ou Revisão.");
                } else {
                    throw new PermissionDeniedException("Você não tem permissão para submeter este documento.");
                }
                break;
            case REVISION:
                if (oldStatus == DocumentStatus.SUBMITTED && document.canUserApproveDocument(currentUser)) { 
                    if (!StringUtils.hasText(reason)) {
                        throw new IllegalArgumentException("Um motivo é obrigatório para solicitar revisão.");
                    }
                    canChange = true;
                    document.setRejectionReason(reason);
                    document.setRejectedAt(LocalDateTime.now());
                } else if (oldStatus != DocumentStatus.SUBMITTED) {
                    throw new IllegalStateException("Documento só pode ser enviado para revisão se estiver Submetido.");
                } else {
                    throw new PermissionDeniedException("Você não tem permissão para solicitar revisão deste documento.");
                }
                break;
            case REJECTED:
                if ((oldStatus == DocumentStatus.SUBMITTED || oldStatus == DocumentStatus.REVISION)
                        && document.canUserApproveDocument(currentUser)) {
                    if (!StringUtils.hasText(reason)) {
                        throw new IllegalArgumentException("Um motivo é obrigatório para rejeitar o documento.");
                    }
                    canChange = true;
                    document.setRejectionReason(reason);
                    document.setRejectedAt(LocalDateTime.now());
                    document.setApprovedAt(null);
                } else if (!(oldStatus == DocumentStatus.SUBMITTED || oldStatus == DocumentStatus.REVISION)) {
                    throw new IllegalStateException("Documento só pode ser rejeitado se estiver Submetido ou em Revisão.");
                } else {
                    throw new PermissionDeniedException("Você não tem permissão para rejeitar este documento.");
                }
                break;
            case APPROVED:
                if ((oldStatus == DocumentStatus.SUBMITTED || oldStatus == DocumentStatus.REVISION) && document.canUserApproveDocument(currentUser)) {
                    canChange = true;
                    document.setApprovedAt(LocalDateTime.now());
                    document.setRejectionReason(null); 
                    document.setRejectedAt(null);
                } else if (!(oldStatus == DocumentStatus.SUBMITTED || oldStatus == DocumentStatus.REVISION)) {
                    throw new IllegalStateException("Documento só pode ser aprovado se estiver Submetido ou em Revisão.");
                } else {
                    throw new PermissionDeniedException("Você não tem permissão para aprovar este documento.");
                }
                break;
            case FINALIZED:
                if (oldStatus == DocumentStatus.APPROVED && (document.canUserManageCollaborators(currentUser) || userHasRole(currentUser, "ADMIN"))) {
                    canChange = true;
                } else if (oldStatus != DocumentStatus.APPROVED) {
                    throw new IllegalStateException("O documento deve ser Aprovado antes de ser Finalizado.");
                } else {
                     throw new PermissionDeniedException("Você não tem permissão para finalizar este documento.");
                }
                break;
            case DRAFT: 
                boolean isAdmin = userHasRole(currentUser, "ADMIN");
                if (oldStatus == DocumentStatus.FINALIZED && !isAdmin) {
                     throw new PermissionDeniedException("Apenas admins podem reverter um documento Finalizado para Rascunho.");
                }
                if (document.canUserEdit(currentUser) || isAdmin) { 
                    canChange = true;
                    document.setSubmittedAt(null);
                    document.setApprovedAt(null);
                    document.setRejectedAt(null);
                    document.setRejectionReason(null);
                } else {
                     throw new PermissionDeniedException("Você não tem permissão para reverter este documento para rascunho.");
                }
                break;
            default:
                 throw new IllegalArgumentException("Novo status desconhecido ou transição não permitida: " + newStatus);
        }

        if (!canChange) {
            throw new IllegalStateException("Transição de status inválida ou permissão negada.");
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

        boolean isPrimaryStudent = document.getCollaborator(currentUser)
                .map(c -> c.getRole() == CollaboratorRole.PRIMARY_STUDENT && c.isActive())
                .orElse(false);
        
        boolean isAdmin = userHasRole(currentUser, "ADMIN"); 

        if (!isAdmin && !isPrimaryStudent) {
            logger.warn("Permissão negada: Usuário {} tentou excluir Documento ID {} sem ser admin ou estudante principal.", currentUser.getEmail(), id);
            throw new PermissionDeniedException("Apenas o estudante principal ou administrador podem excluir documentos.");
        }

        if (document.getStatus() != DocumentStatus.DRAFT && !isAdmin) { 
            logger.warn("Tentativa de exclusão de Documento ID {} que não está em DRAFT por {}", id, currentUser.getEmail());
            throw new IllegalStateException("Apenas documentos em rascunho podem ser excluídos por estudantes (não admins).");
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
        return mapToDTO(document, null);
    }

    private DocumentDTO mapToDTO(Document document, Integer prefetchedVersionCount) {
        DocumentDTO dto = new DocumentDTO();
        dto.setId(document.getId());
        dto.setTitle(document.getTitle());
        dto.setDescription(document.getDescription());
        dto.setStatus(document.getStatus());

        User primaryStudent = document.getPrimaryStudent();
        if (primaryStudent != null) {
            dto.setStudentName(primaryStudent.getName());
        }

        User primaryAdvisor = document.getPrimaryAdvisor();
        if (primaryAdvisor != null) {
            dto.setAdvisorName(primaryAdvisor.getName());
        }
        
        dto.setCreatedAt(document.getCreatedAt());
        dto.setUpdatedAt(document.getUpdatedAt());
        dto.setSubmittedAt(document.getSubmittedAt());
        dto.setApprovedAt(document.getApprovedAt());
        dto.setRejectedAt(document.getRejectedAt());
        dto.setRejectionReason(document.getRejectionReason());

        if (prefetchedVersionCount != null) {
            dto.setVersionCount(prefetchedVersionCount);
        } else {
            dto.setVersionCount(document.getVersions() != null ? document.getVersions().size() : 0);
        }

        return dto;
    }

    private DocumentDetailDTO mapToDetailDTO(Document document, User currentUser) {
        DocumentDetailDTO dto = new DocumentDetailDTO(mapToDTO(document));

        dto.setCollaborators(document.getCollaborators().stream()
                .filter(DocumentCollaborator::isActive)
                .map(this::mapCollaboratorToDTO)
                .collect(Collectors.toList()));

        dto.setStudents(document.getAllStudents().stream()
                .map(u -> new UserSelectionDTO(u.getId(), u.getName(), u.getEmail()))
                .collect(Collectors.toList()));
        dto.setAdvisors(document.getAllAdvisors().stream()
                .map(u -> new UserSelectionDTO(u.getId(), u.getName(), u.getEmail()))
                .collect(Collectors.toList()));

        dto.setCanEdit(document.canUserEdit(currentUser));
        dto.setCanManageCollaborators(document.canUserManageCollaborators(currentUser));
        dto.setCanSubmitDocument(document.canUserSubmitDocument(currentUser));
        dto.setCanApproveDocument(document.canUserApproveDocument(currentUser));
        dto.setCanAddMoreStudents(document.canAddMoreStudents());
        dto.setCanAddMoreAdvisors(document.canAddMoreAdvisors());
        dto.setActiveStudentCount(document.getActiveStudentCount());
        dto.setActiveAdvisorCount(document.getActiveAdvisorCount());
        dto.setMaxStudents(document.getMaxStudents());
        dto.setMaxAdvisors(document.getMaxAdvisors());
        dto.setAllowMultipleStudents(document.isAllowMultipleStudents());
        dto.setAllowMultipleAdvisors(document.isAllowMultipleAdvisors());
        User primaryStudent = document.getPrimaryStudent();
        dto.setPrimaryStudentName(primaryStudent != null ? primaryStudent.getName() : null);
        User primaryAdvisor = document.getPrimaryAdvisor();
        dto.setPrimaryAdvisorName(primaryAdvisor != null ? primaryAdvisor.getName() : null);
        dto.setAllStudentNames(document.getAllStudentNames());
        dto.setAllAdvisorNames(document.getAllAdvisorNames());

        return dto;
    }

    private DocumentCollaboratorDTO mapCollaboratorToDTO(DocumentCollaborator collaborator) {
        DocumentCollaboratorDTO dto = new DocumentCollaboratorDTO();
        dto.setId(collaborator.getId());
        dto.setDocumentId(collaborator.getDocument().getId());
        dto.setUserId(collaborator.getUser().getId());
        dto.setUserName(collaborator.getUser().getName());
        dto.setUserEmail(collaborator.getUser().getEmail());
        dto.setRole(collaborator.getRole());
        dto.setPermission(collaborator.getPermission());
        dto.recalculatePermissions();
        dto.setAddedAt(collaborator.getAddedAt());
        dto.setAddedByName(collaborator.getAddedBy() != null ? collaborator.getAddedBy().getName() : null);
        dto.setActive(collaborator.isActive());
        return dto;
    }
}