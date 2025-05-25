package com.tessera.backend.service;

import com.tessera.backend.dto.DocumentCollaboratorDTO;
import com.tessera.backend.dto.AddCollaboratorRequestDTO;
import com.tessera.backend.entity.*;
import com.tessera.backend.exception.ResourceNotFoundException;
import com.tessera.backend.repository.DocumentCollaboratorRepository;
import com.tessera.backend.repository.DocumentRepository;
import com.tessera.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class DocumentCollaboratorService {
    
    @Autowired
    private DocumentCollaboratorRepository collaboratorRepository;
    
    @Autowired
    private DocumentRepository documentRepository;
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private NotificationEventService notificationEventService;
    
    @Autowired
    private AuthorizationService authorizationService;
    
    public List<DocumentCollaboratorDTO> getDocumentCollaborators(Long documentId) {
        Document document = documentRepository.findById(documentId)
                .orElseThrow(() -> new ResourceNotFoundException("Documento não encontrado"));
        
        List<DocumentCollaborator> collaborators = collaboratorRepository.findByDocumentAndActiveTrue(document);
        return collaborators.stream().map(this::mapToDTO).collect(Collectors.toList());
    }
    
    public DocumentCollaboratorDTO addCollaborator(Long documentId, AddCollaboratorRequestDTO request, User currentUser) {
        Document document = documentRepository.findById(documentId)
                .orElseThrow(() -> new ResourceNotFoundException("Documento não encontrado"));
        
        // Verificar permissões
        if (!authorizationService.canManageCollaborators(currentUser, document)) {
            throw new RuntimeException("Você não tem permissão para gerenciar colaboradores");
        }
        
        User newCollaborator = userRepository.findByEmail(request.getUserEmail())
                .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado com email: " + request.getUserEmail()));
        
        // Verificar se já é colaborador
        if (collaboratorRepository.existsByDocumentAndUserAndActiveTrue(document, newCollaborator)) {
            throw new RuntimeException("Usuário já é colaborador deste documento");
        }
        
        // Validar regras de negócio
        validateCollaboratorRules(document, request.getRole(), newCollaborator);
        
        DocumentCollaborator collaborator = new DocumentCollaborator();
        collaborator.setDocument(document);
        collaborator.setUser(newCollaborator);
        collaborator.setRole(request.getRole());
        collaborator.setPermission(request.getPermission());
        collaborator.setAddedBy(currentUser);
        
        collaborator = collaboratorRepository.save(collaborator);
        
        // Notificar o novo colaborador
        notificationEventService.onCollaboratorAdded(document, newCollaborator, currentUser, request.getRole());
        
        return mapToDTO(collaborator);
    }
    
    public void removeCollaborator(Long documentId, Long collaboratorId, User currentUser) {
        Document document = documentRepository.findById(documentId)
                .orElseThrow(() -> new ResourceNotFoundException("Documento não encontrado"));
        
        DocumentCollaborator collaborator = collaboratorRepository.findById(collaboratorId)
                .orElseThrow(() -> new ResourceNotFoundException("Colaborador não encontrado"));
        
        // Verificar permissões
        if (!authorizationService.canManageCollaborators(currentUser, document)) {
            throw new RuntimeException("Você não tem permissão para gerenciar colaboradores");
        }
        
        // Não permitir remover estudante ou orientador principal
        if (collaborator.getRole().isPrimary()) {
            throw new RuntimeException("Não é possível remover o " + collaborator.getRole().getDisplayName());
        }
        
        collaborator.setActive(false);
        collaboratorRepository.save(collaborator);
        
        // Notificar sobre remoção
        notificationEventService.onCollaboratorRemoved(document, collaborator.getUser(), currentUser);
    }
    
    public DocumentCollaboratorDTO updateCollaboratorPermissions(Long collaboratorId, CollaboratorPermission newPermission, User currentUser) {
        DocumentCollaborator collaborator = collaboratorRepository.findById(collaboratorId)
                .orElseThrow(() -> new ResourceNotFoundException("Colaborador não encontrado"));
        
        Document document = collaborator.getDocument();
        
        // Verificar permissões
        if (!authorizationService.canManageCollaborators(currentUser, document)) {
            throw new RuntimeException("Você não tem permissão para gerenciar colaboradores");
        }
        
        // Não permitir alterar permissões de usuários primários
        if (collaborator.getRole().isPrimary()) {
            throw new RuntimeException("Não é possível alterar permissões do " + collaborator.getRole().getDisplayName());
        }
        
        collaborator.setPermission(newPermission);
        collaborator = collaboratorRepository.save(collaborator);
        
        return mapToDTO(collaborator);
    }
    
    public void migrateExistingDocuments() {
        // Método para migrar documentos existentes para o novo sistema de colaboradores
        List<Document> documents = documentRepository.findAll();
        
        for (Document document : documents) {
            // Adicionar estudante principal se existir e não tiver colaboradores
            if (document.getStudent() != null && document.getCollaborators().isEmpty()) {
                DocumentCollaborator studentCollaborator = new DocumentCollaborator();
                studentCollaborator.setDocument(document);
                studentCollaborator.setUser(document.getStudent());
                studentCollaborator.setRole(CollaboratorRole.PRIMARY_STUDENT);
                studentCollaborator.setPermission(CollaboratorPermission.FULL_ACCESS);
                studentCollaborator.setAddedBy(document.getStudent());
                collaboratorRepository.save(studentCollaborator);
            }
            
            // Adicionar orientador principal se existir
            if (document.getAdvisor() != null && 
                !collaboratorRepository.existsByDocumentAndUserAndActiveTrue(document, document.getAdvisor())) {
                DocumentCollaborator advisorCollaborator = new DocumentCollaborator();
                advisorCollaborator.setDocument(document);
                advisorCollaborator.setUser(document.getAdvisor());
                advisorCollaborator.setRole(CollaboratorRole.PRIMARY_ADVISOR);
                advisorCollaborator.setPermission(CollaboratorPermission.FULL_ACCESS);
                advisorCollaborator.setAddedBy(document.getStudent());
                collaboratorRepository.save(advisorCollaborator);
            }
        }
    }
    
    private void validateCollaboratorRules(Document document, CollaboratorRole role, User user) {
        // Verificar se o usuário tem o papel apropriado
        if (role.isStudent() && !user.getRoles().stream().anyMatch(r -> r.getName().equals("STUDENT"))) {
            throw new RuntimeException("Usuário não é um estudante");
        }
        
        if (role.isAdvisor() && !user.getRoles().stream().anyMatch(r -> r.getName().equals("ADVISOR"))) {
            throw new RuntimeException("Usuário não é um orientador");
        }
        
        // Verificar limites (opcional)
        long studentCount = collaboratorRepository.countByDocumentAndRoleAndActiveTrue(document, CollaboratorRole.SECONDARY_STUDENT);
        if (role == CollaboratorRole.SECONDARY_STUDENT && studentCount >= 3) {
            throw new RuntimeException("Limite máximo de estudantes colaboradores atingido (3)");
        }
        
        long advisorCount = collaboratorRepository.countByDocumentAndRoleAndActiveTrue(document, CollaboratorRole.SECONDARY_ADVISOR);
        if (role == CollaboratorRole.SECONDARY_ADVISOR && advisorCount >= 2) {
            throw new RuntimeException("Limite máximo de orientadores colaboradores atingido (2)");
        }
    }
    
    private DocumentCollaboratorDTO mapToDTO(DocumentCollaborator collaborator) {
        DocumentCollaboratorDTO dto = new DocumentCollaboratorDTO();
        dto.setId(collaborator.getId());
        dto.setDocumentId(collaborator.getDocument().getId());
        dto.setUserId(collaborator.getUser().getId());
        dto.setUserName(collaborator.getUser().getName());
        dto.setUserEmail(collaborator.getUser().getEmail());
        dto.setRole(collaborator.getRole());
        dto.setPermission(collaborator.getPermission());
        dto.setAddedAt(collaborator.getAddedAt());
        dto.setAddedByName(collaborator.getAddedBy() != null ? collaborator.getAddedBy().getName() : null);
        dto.setActive(collaborator.isActive());
        return dto;
    }
}