package com.tessera.backend.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
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
        // Verificar se o estudante e o orientador existem
        User student = userRepository.findById(documentDTO.getStudentId())
                .orElseThrow(() -> new ResourceNotFoundException("Estudante não encontrado"));
        
        User advisor = userRepository.findById(documentDTO.getAdvisorId())
                .orElseThrow(() -> new ResourceNotFoundException("Orientador não encontrado"));
        
        // Verificar se o usuário atual é o estudante ou tem permissão administrativa
        if (!currentUser.getId().equals(student.getId()) && 
            !currentUser.getRoles().stream().anyMatch(r -> r.getName().equals("ADMIN"))) {
            throw new RuntimeException("Você não tem permissão para criar documentos para este estudante");
        }
        
        Document document = new Document();
        document.setTitle(documentDTO.getTitle());
        document.setDescription(documentDTO.getDescription());
        document.setStudent(student);
        document.setAdvisor(advisor);
        document.setStatus(DocumentStatus.DRAFT);
        
        document = documentRepository.save(document);
        
        // Disparar evento de notificação
        notificationEventService.onDocumentCreated(document, currentUser);
        
        return mapToDTO(document);
    }
    
    public DocumentDTO getDocument(Long id) {
        Document document = documentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Documento não encontrado"));
        return mapToDTO(document);
    }
    
    public List<DocumentDTO> getDocumentsByStudent(User student) {
        List<Document> documents = documentRepository.findByStudent(student);
        return documents.stream().map(this::mapToDTO).collect(Collectors.toList());
    }
    
    public List<DocumentDTO> getDocumentsByAdvisor(User advisor) {
        List<Document> documents = documentRepository.findByAdvisor(advisor);
        return documents.stream().map(this::mapToDTO).collect(Collectors.toList());
    }
    
    public Page<DocumentDTO> getDocumentsByStudent(User student, Pageable pageable) {
        Page<Document> documents = documentRepository.findByStudent(student, pageable);
        return documents.map(this::mapToDTO);
    }
    
    public Page<DocumentDTO> getDocumentsByAdvisor(User advisor, Pageable pageable) {
        Page<Document> documents = documentRepository.findByAdvisor(advisor, pageable);
        return documents.map(this::mapToDTO);
    }
    
    @Transactional
    public DocumentDTO updateDocument(Long id, DocumentDTO documentDTO, User currentUser) {
        Document document = documentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Documento não encontrado"));
        
        // Verificar permissões
        if (!currentUser.getId().equals(document.getStudent().getId()) && 
            !currentUser.getRoles().stream().anyMatch(r -> r.getName().equals("ADMIN"))) {
            throw new RuntimeException("Você não tem permissão para atualizar este documento");
        }
        
        document.setTitle(documentDTO.getTitle());
        document.setDescription(documentDTO.getDescription());
        
        document = documentRepository.save(document);
        return mapToDTO(document);
    }
    
    @Transactional
    public DocumentDTO changeStatus(Long id, DocumentStatus newStatus, User currentUser, String reason) {
        Document document = documentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Documento não encontrado"));
        
        // Armazenar status anterior para comparação
        DocumentStatus oldStatus = document.getStatus();
        
        // Verificar permissões baseadas no fluxo de trabalho
        if (newStatus == DocumentStatus.SUBMITTED) {
            // Somente o aluno pode submeter
            if (!currentUser.getId().equals(document.getStudent().getId())) {
                throw new RuntimeException("Apenas o estudante pode submeter o documento");
            }
            document.setSubmittedAt(LocalDateTime.now());
            
            // Disparar evento de notificação
            notificationEventService.onDocumentSubmitted(document, currentUser);
            
        } else if (newStatus == DocumentStatus.REVISION || newStatus == DocumentStatus.APPROVED) {
            // Somente o orientador pode aprovar ou solicitar revisão
            if (!currentUser.getId().equals(document.getAdvisor().getId())) {
                throw new RuntimeException("Apenas o orientador pode aprovar ou solicitar revisão");
            }
            
            if (newStatus == DocumentStatus.APPROVED) {
                document.setApprovedAt(LocalDateTime.now());
            }
        } else if (newStatus == DocumentStatus.FINALIZED) {
            // Verificar se foi aprovado antes de finalizar
            if (document.getStatus() != DocumentStatus.APPROVED) {
                throw new RuntimeException("O documento deve ser aprovado antes de ser finalizado");
            }
            
            // Ambos podem finalizar
            if (!currentUser.getId().equals(document.getStudent().getId()) && 
                !currentUser.getId().equals(document.getAdvisor().getId())) {
                throw new RuntimeException("Apenas o estudante ou orientador podem finalizar");
            }
        }
        
        // Atualizar status
        document.setStatus(newStatus);
        
        // Se rejeitar, salvar motivo
        if (reason != null && !reason.trim().isEmpty()) {
            document.setRejectionReason(reason);
            document.setRejectedAt(LocalDateTime.now());
        }
        
        document = documentRepository.save(document);
        
        // Disparar evento de notificação se o status mudou
        if (oldStatus != newStatus) {
            notificationEventService.onDocumentStatusChanged(document, oldStatus, currentUser);
        }
        
        return mapToDTO(document);
    }
    
    @Transactional
    public void deleteDocument(Long id, User currentUser) {
        Document document = documentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Documento não encontrado"));
        
        // Verificar permissões
        if (!currentUser.getId().equals(document.getStudent().getId()) && 
            !currentUser.getRoles().stream().anyMatch(r -> r.getName().equals("ADMIN"))) {
            throw new RuntimeException("Você não tem permissão para excluir este documento");
        }
        
        // Só permitir exclusão de documentos em rascunho
        if (document.getStatus() != DocumentStatus.DRAFT) {
            throw new RuntimeException("Apenas documentos em rascunho podem ser excluídos");
        }
        
        documentRepository.delete(document);
    }
    
    private DocumentDTO mapToDTO(Document document) {
        DocumentDTO dto = new DocumentDTO();
        dto.setId(document.getId());
        dto.setTitle(document.getTitle());
        dto.setDescription(document.getDescription());
        dto.setStatus(document.getStatus());
        dto.setStudentId(document.getStudent().getId());
        dto.setAdvisorId(document.getAdvisor().getId());
        dto.setStudentName(document.getStudent().getName());
        dto.setAdvisorName(document.getAdvisor().getName());
        dto.setCreatedAt(document.getCreatedAt());
        dto.setUpdatedAt(document.getUpdatedAt());
        dto.setSubmittedAt(document.getSubmittedAt());
        dto.setApprovedAt(document.getApprovedAt());
        dto.setRejectedAt(document.getRejectedAt());
        dto.setRejectionReason(document.getRejectionReason());
        dto.setVersionCount(document.getVersions().size());
        
        return dto;
    }
}