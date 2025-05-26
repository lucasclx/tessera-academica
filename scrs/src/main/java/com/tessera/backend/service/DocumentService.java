package com.tessera.backend.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import com.tessera.backend.dto.DocumentDTO;
import com.tessera.backend.entity.*;
import com.tessera.backend.exception.ResourceNotFoundException;
import com.tessera.backend.repository.DocumentCollaboratorRepository;
import com.tessera.backend.repository.DocumentRepository;
import com.tessera.backend.repository.UserRepository;

@Service
public class DocumentService {
    
    @Autowired
    private DocumentRepository documentRepository;
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private DocumentCollaboratorRepository collaboratorRepository;
    
    @Autowired
    private NotificationEventService notificationEventService;
    
    @Transactional
    public DocumentDTO createDocument(DocumentDTO documentDTO, User currentUser) {
        User student = userRepository.findById(documentDTO.getStudentId())
                .orElseThrow(() -> new ResourceNotFoundException("Estudante não encontrado com ID: " + documentDTO.getStudentId()));
        
        User advisor = userRepository.findById(documentDTO.getAdvisorId())
                .orElseThrow(() -> new ResourceNotFoundException("Orientador não encontrado com ID: " + documentDTO.getAdvisorId()));
        
        // Verificação de permissão: usuário atual deve ser o estudante do documento ou um ADMIN.
        if (!currentUser.getId().equals(student.getId()) && 
            !currentUser.getRoles().stream().anyMatch(r -> r.getName().equals("ADMIN"))) {
            throw new RuntimeException("Você não tem permissão para criar documentos para este estudante.");
        }
        
        Document document = new Document();
        document.setTitle(documentDTO.getTitle());
        document.setDescription(documentDTO.getDescription());
        document.setStudent(student); // Manter para compatibilidade
        document.setAdvisor(advisor); // Manter para compatibilidade
        document.setStatus(DocumentStatus.DRAFT);
        
        document = documentRepository.save(document);
        
        // Criar colaboradores principais automaticamente
        createPrimaryCollaborators(document, student, advisor, currentUser);
        
        // Disparar evento de notificação
        notificationEventService.onDocumentCreated(document, currentUser);
        
        return mapToDTO(document);
    }
    
    /**
     * Cria os colaboradores principais (estudante e orientador) automaticamente
     */
    private void createPrimaryCollaborators(Document document, User student, User advisor, User creator) {
        // Criar colaborador estudante principal
        DocumentCollaborator studentCollaborator = new DocumentCollaborator();
        studentCollaborator.setDocument(document);
        studentCollaborator.setUser(student);
        studentCollaborator.setRole(CollaboratorRole.PRIMARY_STUDENT);
        studentCollaborator.setPermission(CollaboratorPermission.FULL_ACCESS);
        studentCollaborator.setAddedBy(creator);
        collaboratorRepository.save(studentCollaborator);
        
        // Criar colaborador orientador principal
        DocumentCollaborator advisorCollaborator = new DocumentCollaborator();
        advisorCollaborator.setDocument(document);
        advisorCollaborator.setUser(advisor);
        advisorCollaborator.setRole(CollaboratorRole.PRIMARY_ADVISOR);
        advisorCollaborator.setPermission(CollaboratorPermission.FULL_ACCESS);
        advisorCollaborator.setAddedBy(creator);
        collaboratorRepository.save(advisorCollaborator);
    }
    
    public DocumentDTO getDocument(Long id) {
        Document document = documentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Documento não encontrado com ID: " + id));
        return mapToDTO(document);
    }
    
    /**
     * Retorna documentos onde o usuário é colaborador (estudante ou orientador)
     */
    public Page<DocumentDTO> getDocumentsByCollaborator(User user, String searchTerm, String statusFilter, Pageable pageable) {
        // Tornar as variáveis final para uso em lambda
        final DocumentStatus status = parseStatus(statusFilter);
        final String finalSearchTerm = StringUtils.hasText(searchTerm) ? searchTerm.trim() : null;
        
        // Buscar documentos onde o usuário é colaborador ativo usando repository personalizado
        if (status != null && finalSearchTerm != null) {
            return documentRepository.findByCollaboratorWithSearchAndStatus(user, finalSearchTerm, status, pageable)
                    .map(this::mapToDTO);
        } else if (status != null) {
            return documentRepository.findByCollaboratorAndStatus(user, status, pageable)
                    .map(this::mapToDTO);
        } else if (finalSearchTerm != null) {
            return documentRepository.findByCollaboratorWithSearch(user, finalSearchTerm, pageable)
                    .map(this::mapToDTO);
        } else {
            return documentRepository.findByCollaborator(user, pageable)
                    .map(this::mapToDTO);
        }
    }
    
    /**
     * Métodos existentes mantidos para compatibilidade, mas agora usando colaboradores
     */
    public Page<DocumentDTO> getDocumentsByStudentWithFilters(User student, String searchTerm, String statusFilter, Pageable pageable) {
        return getDocumentsByCollaborator(student, searchTerm, statusFilter, pageable);
    }
    
    public Page<DocumentDTO> getDocumentsByAdvisorWithFilters(User advisor, String searchTerm, String statusFilter, Pageable pageable) {
        return getDocumentsByCollaborator(advisor, searchTerm, statusFilter, pageable);
    }
    
    @Transactional
    public DocumentDTO updateDocument(Long id, DocumentDTO documentDTO, User currentUser) {
        Document document = documentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Documento não encontrado com ID: " + id));
        
        // Verificar permissões usando o novo sistema de colaboradores
        if (!document.canUserEdit(currentUser) && 
            !currentUser.getRoles().stream().anyMatch(r -> r.getName().equals("ADMIN"))) {
            throw new RuntimeException("Você não tem permissão para atualizar este documento.");
        }
        
        // Atualizar campos básicos
        if (StringUtils.hasText(documentDTO.getTitle()) && !documentDTO.getTitle().equals(document.getTitle())) {
            document.setTitle(documentDTO.getTitle());
        }
        if (documentDTO.getDescription() != null && !documentDTO.getDescription().equals(document.getDescription())) {
            document.setDescription(documentDTO.getDescription());
        }
        
        document = documentRepository.save(document);
        return mapToDTO(document);
    }
    
    @Transactional
    public DocumentDTO changeStatus(Long id, DocumentStatus newStatus, User currentUser, String reason) {
        Document document = documentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Documento não encontrado com ID: " + id));
        
        DocumentStatus oldStatus = document.getStatus();
        
        // Lógica de transição de status usando o novo sistema de colaboradores
        switch (newStatus) {
            case SUBMITTED:
                if (!document.canUserSubmitDocument(currentUser)) {
                    throw new RuntimeException("Você não tem permissão para submeter este documento.");
                }
                if (document.getStatus() != DocumentStatus.DRAFT && document.getStatus() != DocumentStatus.REVISION) {
                     throw new RuntimeException("Documento só pode ser submetido se estiver em Rascunho ou Revisão.");
                }
                document.setSubmittedAt(LocalDateTime.now());
                notificationEventService.onDocumentSubmitted(document, currentUser);
                break;
                
            case REVISION:
                if (!document.canUserApproveDocument(currentUser)) {
                    throw new RuntimeException("Você não tem permissão para solicitar revisão.");
                }
                 if (document.getStatus() != DocumentStatus.SUBMITTED) {
                    throw new RuntimeException("Documento só pode ser enviado para revisão se estiver Submetido.");
                }
                document.setRejectionReason(reason);
                document.setRejectedAt(LocalDateTime.now());
                break;
                
            case APPROVED:
                if (!document.canUserApproveDocument(currentUser)) {
                    throw new RuntimeException("Você não tem permissão para aprovar este documento.");
                }
                if (document.getStatus() != DocumentStatus.SUBMITTED && document.getStatus() != DocumentStatus.REVISION) {
                    throw new RuntimeException("Documento só pode ser aprovado se estiver Submetido ou em Revisão.");
                }
                document.setApprovedAt(LocalDateTime.now());
                document.setRejectionReason(null);
                break;
                
            case FINALIZED:
                if (document.getStatus() != DocumentStatus.APPROVED) {
                    throw new RuntimeException("O documento deve ser aprovado antes de ser finalizado.");
                }
                // Qualquer colaborador com permissão de escrita pode finalizar
                if (!document.canUserEdit(currentUser) && !document.canUserApproveDocument(currentUser)) {
                    throw new RuntimeException("Você não tem permissão para finalizar este documento.");
                }
                break;
                
            case DRAFT:
                if (!document.canUserEdit(currentUser) && !document.canUserApproveDocument(currentUser)) {
                    throw new RuntimeException("Você não tem permissão para alterar o status deste documento.");
                }
                break;
                
            default:
                 throw new IllegalArgumentException("Novo status desconhecido: " + newStatus);
        }
        
        document.setStatus(newStatus);
        document = documentRepository.save(document);
        
        if (oldStatus != newStatus) {
            notificationEventService.onDocumentStatusChanged(document, oldStatus, currentUser);
        }
        
        return mapToDTO(document);
    }
    
    @Transactional
    public void deleteDocument(Long id, User currentUser) {
        Document document = documentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Documento não encontrado com ID: " + id));
        
        // Verificar permissões - apenas estudante principal ou admin podem deletar
        boolean isPrimaryStudent = document.getCollaborator(currentUser)
                .map(c -> c.getRole() == CollaboratorRole.PRIMARY_STUDENT)
                .orElse(false);
        
        boolean isAdmin = currentUser.getRoles().stream()
                .anyMatch(r -> r.getName().equals("ADMIN"));
        
        if (!isPrimaryStudent && !isAdmin) {
            throw new RuntimeException("Apenas o estudante principal ou administrador podem excluir documentos.");
        }
        
        if (document.getStatus() != DocumentStatus.DRAFT) {
            throw new RuntimeException("Apenas documentos em rascunho podem ser excluídos.");
        }
        
        documentRepository.delete(document);
    }
    
    // =====================================================================
    // MÉTODOS AUXILIARES
    // =====================================================================
    
    /**
     * Converte string de status para enum, com tratamento de erro
     */
    private DocumentStatus parseStatus(String statusFilter) {
        if (!StringUtils.hasText(statusFilter) || statusFilter.equalsIgnoreCase("ALL")) {
            return null;
        }
        
        try {
            return DocumentStatus.valueOf(statusFilter.toUpperCase());
        } catch (IllegalArgumentException e) {
            System.err.println("Status de filtro inválido: " + statusFilter);
            return null;
        }
    }
    
    private DocumentDTO mapToDTO(Document document) {
        DocumentDTO dto = new DocumentDTO();
        dto.setId(document.getId());
        dto.setTitle(document.getTitle());
        dto.setDescription(document.getDescription());
        dto.setStatus(document.getStatus());
        
        // Usar novo sistema de colaboradores para preencher estudante e orientador
        User primaryStudent = document.getPrimaryStudent();
        if (primaryStudent != null) {
            dto.setStudentId(primaryStudent.getId());
            dto.setStudentName(document.getAllStudentNames()); // Incluir todos os estudantes
        }
        
        User primaryAdvisor = document.getPrimaryAdvisor();
        if (primaryAdvisor != null) {
            dto.setAdvisorId(primaryAdvisor.getId());
            dto.setAdvisorName(document.getAllAdvisorNames()); // Incluir todos os orientadores
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