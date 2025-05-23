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
import com.tessera.backend.entity.Document;
import com.tessera.backend.entity.DocumentStatus;
import com.tessera.backend.entity.User;
import com.tessera.backend.exception.ResourceNotFoundException;
import com.tessera.backend.repository.DocumentRepository;
import com.tessera.backend.repository.UserRepository;

@Service
public class DocumentService {
    
    @Autowired
    private DocumentRepository documentRepository;
    
    @Autowired
    private UserRepository userRepository;
    
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
        document.setStudent(student);
        document.setAdvisor(advisor);
        document.setStatus(DocumentStatus.DRAFT); // Status inicial
        
        document = documentRepository.save(document);
        
        // Disparar evento de notificação
        notificationEventService.onDocumentCreated(document, currentUser);
        
        return mapToDTO(document);
    }
    
    public DocumentDTO getDocument(Long id) {
        Document document = documentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Documento não encontrado com ID: " + id));
        return mapToDTO(document);
    }
    
    // Listagem simples (sem paginação ou filtro avançado) - pode ser mantida se houver uso.
    public List<DocumentDTO> getDocumentsByStudent(User student) {
        List<Document> documents = documentRepository.findByStudent(student);
        return documents.stream().map(this::mapToDTO).collect(Collectors.toList());
    }
    
    public List<DocumentDTO> getDocumentsByAdvisor(User advisor) {
        List<Document> documents = documentRepository.findByAdvisor(advisor);
        return documents.stream().map(this::mapToDTO).collect(Collectors.toList());
    }

    // Métodos PAGINADOS com FILTRO (searchTerm e statusFilter) e ORDENAÇÃO (via Pageable)
    public Page<DocumentDTO> getDocumentsByStudentWithFilters(User student, String searchTerm, String statusFilter, Pageable pageable) {
        DocumentStatus status = null;
        if (StringUtils.hasText(statusFilter) && !statusFilter.equalsIgnoreCase("ALL")) {
            try {
                status = DocumentStatus.valueOf(statusFilter.toUpperCase());
            } catch (IllegalArgumentException e) {
                // Log ou trata o erro de status inválido, por enquanto ignora o filtro de status
                System.err.println("Status de filtro inválido para estudante: " + statusFilter);
            }
        }
        String term = StringUtils.hasText(searchTerm) ? searchTerm.trim() : null;
        Page<Document> documents = documentRepository.findByStudentWithFilters(student, term, status, pageable);
        return documents.map(this::mapToDTO);
    }
    
    public Page<DocumentDTO> getDocumentsByAdvisorWithFilters(User advisor, String searchTerm, String statusFilter, Pageable pageable) {
        DocumentStatus status = null;
        if (StringUtils.hasText(statusFilter) && !statusFilter.equalsIgnoreCase("ALL")) {
             try {
                status = DocumentStatus.valueOf(statusFilter.toUpperCase());
            } catch (IllegalArgumentException e)
            {
                System.err.println("Status de filtro inválido para orientador: " + statusFilter);
            }
        }
        String term = StringUtils.hasText(searchTerm) ? searchTerm.trim() : null;
        Page<Document> documents = documentRepository.findByAdvisorWithFilters(advisor, term, status, pageable);
        return documents.map(this::mapToDTO);
    }
    
    @Transactional
    public DocumentDTO updateDocument(Long id, DocumentDTO documentDTO, User currentUser) {
        Document document = documentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Documento não encontrado com ID: " + id));
        
        // Verificar permissões: Apenas o estudante do documento ou um ADMIN podem atualizar.
        if (!currentUser.getId().equals(document.getStudent().getId()) && 
            !currentUser.getRoles().stream().anyMatch(r -> r.getName().equals("ADMIN"))) {
            throw new RuntimeException("Você não tem permissão para atualizar este documento.");
        }
        
        // Atualizar apenas se os campos estiverem presentes no DTO e forem diferentes
        if (StringUtils.hasText(documentDTO.getTitle()) && !documentDTO.getTitle().equals(document.getTitle())) {
            document.setTitle(documentDTO.getTitle());
        }
        if (documentDTO.getDescription() != null && !documentDTO.getDescription().equals(document.getDescription())) {
            document.setDescription(documentDTO.getDescription());
        }
        // Permitir alteração de orientador pelo estudante, se o documento estiver em DRAFT
        if (documentDTO.getAdvisorId() != null && 
            !documentDTO.getAdvisorId().equals(document.getAdvisor().getId()) &&
            document.getStatus() == DocumentStatus.DRAFT &&
            currentUser.getId().equals(document.getStudent().getId())) {
            User newAdvisor = userRepository.findById(documentDTO.getAdvisorId())
                    .orElseThrow(() -> new ResourceNotFoundException("Novo orientador não encontrado com ID: " + documentDTO.getAdvisorId()));
            document.setAdvisor(newAdvisor);
        }
        
        document = documentRepository.save(document);
        return mapToDTO(document);
    }
    
    @Transactional
    public DocumentDTO changeStatus(Long id, DocumentStatus newStatus, User currentUser, String reason) {
        Document document = documentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Documento não encontrado com ID: " + id));
        
        DocumentStatus oldStatus = document.getStatus();
        
        // Lógica de transição de status e permissões
        switch (newStatus) {
            case SUBMITTED:
                if (!currentUser.getId().equals(document.getStudent().getId())) {
                    throw new RuntimeException("Apenas o estudante pode submeter o documento.");
                }
                if (document.getStatus() != DocumentStatus.DRAFT && document.getStatus() != DocumentStatus.REVISION) {
                     throw new RuntimeException("Documento só pode ser submetido se estiver em Rascunho ou Revisão.");
                }
                document.setSubmittedAt(LocalDateTime.now());
                notificationEventService.onDocumentSubmitted(document, currentUser);
                break;
            case REVISION:
                if (!currentUser.getId().equals(document.getAdvisor().getId())) {
                    throw new RuntimeException("Apenas o orientador pode solicitar revisão.");
                }
                 if (document.getStatus() != DocumentStatus.SUBMITTED) {
                    throw new RuntimeException("Documento só pode ser enviado para revisão se estiver Submetido.");
                }
                document.setRejectionReason(reason); // Usando rejectionReason para a justificativa da revisão
                document.setRejectedAt(LocalDateTime.now()); // Poderia ser um campo `revisionRequestedAt`
                break;
            case APPROVED:
                if (!currentUser.getId().equals(document.getAdvisor().getId())) {
                    throw new RuntimeException("Apenas o orientador pode aprovar o documento.");
                }
                if (document.getStatus() != DocumentStatus.SUBMITTED && document.getStatus() != DocumentStatus.REVISION) {
                    throw new RuntimeException("Documento só pode ser aprovado se estiver Submetido ou em Revisão (após correções).");
                }
                document.setApprovedAt(LocalDateTime.now());
                document.setRejectionReason(null); // Limpar razão de rejeição/revisão anterior
                break;
            case FINALIZED:
                if (document.getStatus() != DocumentStatus.APPROVED) {
                    throw new RuntimeException("O documento deve ser aprovado antes de ser finalizado.");
                }
                // Aluno ou Orientador podem finalizar um documento aprovado.
                if (!currentUser.getId().equals(document.getStudent().getId()) && 
                    !currentUser.getId().equals(document.getAdvisor().getId())) {
                    throw new RuntimeException("Apenas o estudante ou orientador podem finalizar o documento aprovado.");
                }
                break;
            case DRAFT: // Voltar para rascunho (ex: se o orientador "devolver" sem ser formalmente uma revisão)
                 if (!currentUser.getId().equals(document.getAdvisor().getId()) && !currentUser.getId().equals(document.getStudent().getId())) {
                    throw new RuntimeException("Ação não permitida para voltar ao rascunho.");
                }
                 // Poderia ter mais regras aqui, e.g., só se SUBMITTED
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
        
        if (!currentUser.getId().equals(document.getStudent().getId()) && 
            !currentUser.getRoles().stream().anyMatch(r -> r.getName().equals("ADMIN"))) {
            throw new RuntimeException("Você não tem permissão para excluir este documento.");
        }
        
        if (document.getStatus() != DocumentStatus.DRAFT) {
            throw new RuntimeException("Apenas documentos em rascunho podem ser excluídos.");
        }
        
        // Adicionar lógica para deletar versões e comentários associados se cascade não estiver configurado para isso.
        // Por enquanto, assumindo que o CascadeType.ALL em Document -> Versions e Version -> Comments cuidará disso.
        documentRepository.delete(document);
    }
    
    private DocumentDTO mapToDTO(Document document) {
        DocumentDTO dto = new DocumentDTO();
        dto.setId(document.getId());
        dto.setTitle(document.getTitle());
        dto.setDescription(document.getDescription());
        dto.setStatus(document.getStatus());
        if (document.getStudent() != null) {
            dto.setStudentId(document.getStudent().getId());
            dto.setStudentName(document.getStudent().getName());
        }
        if (document.getAdvisor() != null) {
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