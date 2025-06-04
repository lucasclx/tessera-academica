package com.tessera.backend.service;

import com.tessera.backend.dto.DocumentCollaboratorDTO;
import com.tessera.backend.dto.AddCollaboratorRequestDTO;
import com.tessera.backend.entity.*;
import com.tessera.backend.exception.ResourceNotFoundException;
import com.tessera.backend.exception.PermissionDeniedException;
import com.tessera.backend.exception.BusinessRuleException;
import com.tessera.backend.repository.DocumentCollaboratorRepository;
import com.tessera.backend.repository.DocumentRepository;
import com.tessera.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.dao.DataIntegrityViolationException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@Transactional
public class DocumentCollaboratorService {

    private static final Logger logger = LoggerFactory.getLogger(DocumentCollaboratorService.class);
    
    @Autowired
    private DocumentCollaboratorRepository collaboratorRepository;
    
    @Autowired
    private DocumentRepository documentRepository;
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private NotificationEventService notificationEventService;

    /**
     * Lista todos os colaboradores de um documento
     */
    public List<DocumentCollaboratorDTO> getDocumentCollaborators(Long documentId) {
        Document document = documentRepository.findById(documentId)
                .orElseThrow(() -> new ResourceNotFoundException("Documento não encontrado"));
        
        List<DocumentCollaborator> collaborators = collaboratorRepository.findByDocumentAndActiveTrue(document);
        return collaborators.stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }
    
    /**
     * Adiciona um novo colaborador ao documento
     */
    public DocumentCollaboratorDTO addCollaborator(Long documentId, AddCollaboratorRequestDTO request, User currentUser) {
        Document document = documentRepository.findById(documentId)
                .orElseThrow(() -> new ResourceNotFoundException("Documento não encontrado"));
        
        // Verificar permissões
        if (!document.canUserManageCollaborators(currentUser)) {
            throw new PermissionDeniedException("Você não tem permissão para gerenciar colaboradores deste documento");
        }
        
        User newCollaborator = userRepository.findByEmail(request.getUserEmail())
                .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado: " + request.getUserEmail()));
        
        // Verificar se já existe registro (ativo ou inativo)
        Optional<DocumentCollaborator> existingOpt =
                collaboratorRepository.findByDocumentAndUser(document, newCollaborator);
        if (existingOpt.isPresent()) {
            DocumentCollaborator existing = existingOpt.get();
            if (existing.isActive()) {
                throw new BusinessRuleException("Este usuário já é colaborador do documento");
            }

            // Reativar colaborador inativo
            validateCollaboratorAddition(document, request.getRole(), newCollaborator);
            existing.setRole(request.getRole());
            existing.setPermission(request.getPermission());
            existing.setAddedBy(currentUser);
            existing.setInvitationMessage(request.getMessage());
            existing.setRemovalReason(null);
            existing.setActive(true);
            existing.setAddedAt(LocalDateTime.now());

            existing = collaboratorRepository.save(existing);
            notificationEventService.onCollaboratorAdded(document, newCollaborator, currentUser, request.getRole());
            return mapToDTO(existing);
        }

        // Validar regras de negócio
        validateCollaboratorAddition(document, request.getRole(), newCollaborator);
        
        DocumentCollaborator collaborator = new DocumentCollaborator();
        collaborator.setDocument(document);
        collaborator.setUser(newCollaborator);
        collaborator.setRole(request.getRole());
        collaborator.setPermission(request.getPermission());
        collaborator.setAddedBy(currentUser);
        collaborator.setInvitationMessage(request.getMessage());
        
        try {
            collaborator = collaboratorRepository.save(collaborator);
        } catch (DataIntegrityViolationException e) {
            // Possível colisão de chave única devido a concorrência
            Optional<DocumentCollaborator> dup =
                    collaboratorRepository.findByDocumentAndUser(document, newCollaborator);
            if (dup.isPresent()) {
                throw new BusinessRuleException("Este usuário já é colaborador do documento");
            }
            throw e;
        }
        
        // Notificar o novo colaborador
        notificationEventService.onCollaboratorAdded(document, newCollaborator, currentUser, request.getRole());
        
        return mapToDTO(collaborator);
    }

    /**
     * Adiciona múltiplos colaboradores ao documento reutilizando a validação existente
     */
    public List<DocumentCollaboratorDTO> addCollaborators(Long documentId,
                                                         List<AddCollaboratorRequestDTO> requests,
                                                         User currentUser) {
        return requests.stream()
                .map(r -> addCollaborator(documentId, r, currentUser))
                .collect(Collectors.toList());
    }
    
    /**
     * Remove um colaborador do documento
     */
    public void removeCollaborator(Long documentId, Long collaboratorId, User currentUser) {
        Document document = documentRepository.findById(documentId)
                .orElseThrow(() -> new ResourceNotFoundException("Documento não encontrado"));
        
        DocumentCollaborator collaborator = collaboratorRepository.findById(collaboratorId)
                .orElseThrow(() -> new ResourceNotFoundException("Colaborador não encontrado"));
        
        // Verificar permissões
        if (!document.canUserManageCollaborators(currentUser)) {
            throw new PermissionDeniedException("Você não tem permissão para gerenciar colaboradores");
        }
        
        // Não permitir remover colaborador principal se é o único
        if (collaborator.getRole().isPrimary()) {
            if (collaborator.getRole() == CollaboratorRole.PRIMARY_STUDENT && document.getActiveStudentCount() == 1) {
                throw new BusinessRuleException("Não é possível remover o único estudante principal");
            }
            if (collaborator.getRole() == CollaboratorRole.PRIMARY_ADVISOR && document.getActiveAdvisorCount() == 1) {
                throw new BusinessRuleException("Não é possível remover o único orientador principal");
            }
        }
        
        collaborator.setActive(false);
        collaborator.setRemovalReason("Removido por " + currentUser.getName());
        collaboratorRepository.save(collaborator);
        
        // Notificar sobre remoção
        notificationEventService.onCollaboratorRemoved(document, collaborator.getUser(), currentUser);
    }
    
    /**
     * Atualiza as permissões de um colaborador
     */
    public DocumentCollaboratorDTO updateCollaboratorPermissions(Long collaboratorId, 
                                                               CollaboratorPermission newPermission, 
                                                               User currentUser) {
        DocumentCollaborator collaborator = collaboratorRepository.findById(collaboratorId)
                .orElseThrow(() -> new ResourceNotFoundException("Colaborador não encontrado"));
        
        Document document = collaborator.getDocument();
        
        // Verificar permissões
        if (!document.canUserManageCollaborators(currentUser)) {
            throw new PermissionDeniedException("Você não tem permissão para gerenciar colaboradores");
        }
        
        // Validar a mudança de permissão
        validatePermissionChange(collaborator, newPermission);
        
        collaborator.setPermission(newPermission);
        collaborator = collaboratorRepository.save(collaborator);

        return mapToDTO(collaborator);
    }

    /**
     * Popula colaboradores principais em documentos existentes baseados nos campos legados
     * student_id e advisor_id.
     */
    @Transactional
    public void migrateExistingDocuments() {
        List<Object[]> rows = documentRepository.findLegacyCollaboratorIds();
        for (Object[] r : rows) {
            Long docId = ((Number) r[0]).longValue();
            Long studentId = r[1] != null ? ((Number) r[1]).longValue() : null;
            Long advisorId = r[2] != null ? ((Number) r[2]).longValue() : null;

            Document document = documentRepository.findById(docId).orElse(null);
            if (document == null) {
                continue;
            }

            if (studentId != null && !document.hasPrimaryStudent()) {
                userRepository.findById(studentId).ifPresent(student -> {
                    DocumentCollaborator dc = new DocumentCollaborator();
                    dc.setDocument(document);
                    dc.setUser(student);
                    dc.setRole(CollaboratorRole.PRIMARY_STUDENT);
                    dc.setPermission(CollaboratorPermission.FULL_ACCESS);
                    collaboratorRepository.save(dc);
                });
            }

            if (advisorId != null && !document.hasPrimaryAdvisor()) {
                userRepository.findById(advisorId).ifPresent(advisor -> {
                    DocumentCollaborator dc = new DocumentCollaborator();
                    dc.setDocument(document);
                    dc.setUser(advisor);
                    dc.setRole(CollaboratorRole.PRIMARY_ADVISOR);
                    dc.setPermission(CollaboratorPermission.FULL_ACCESS);
                    collaboratorRepository.save(dc);
                });
            }
        }
    }
    
    /**
     * Atualiza o papel de um colaborador
     */
    public DocumentCollaboratorDTO updateCollaboratorRole(Long collaboratorId, 
                                                         CollaboratorRole newRole, 
                                                         User currentUser) {
        DocumentCollaborator collaborator = collaboratorRepository.findById(collaboratorId)
                .orElseThrow(() -> new ResourceNotFoundException("Colaborador não encontrado"));
        
        Document document = collaborator.getDocument();
        
        // Verificar permissões
        if (!document.canUserManageCollaborators(currentUser)) {
            throw new PermissionDeniedException("Você não tem permissão para gerenciar colaboradores");
        }
        
        // Validar a mudança de papel
        validateRoleChange(document, collaborator, newRole);
        
        collaborator.setRole(newRole);
        collaborator = collaboratorRepository.save(collaborator);
        
        return mapToDTO(collaborator);
    }
    
    /**
     * Promove um colaborador a papel principal
     */
    public DocumentCollaboratorDTO promoteToPrimary(Long collaboratorId, User currentUser) {
        DocumentCollaborator collaborator = collaboratorRepository.findById(collaboratorId)
                .orElseThrow(() -> new ResourceNotFoundException("Colaborador não encontrado"));
        
        Document document = collaborator.getDocument();
        
        // Verificar permissões
        if (!document.canUserManageCollaborators(currentUser)) {
            throw new PermissionDeniedException("Você não tem permissão para gerenciar colaboradores");
        }
        
        // Determinar novo papel principal
        CollaboratorRole newRole;
        if (collaborator.getRole().isStudent()) {
            newRole = CollaboratorRole.PRIMARY_STUDENT;
            // Rebaixar atual principal para colaborador
            demoteCurrentPrimary(document, CollaboratorRole.PRIMARY_STUDENT, CollaboratorRole.SECONDARY_STUDENT);
        } else if (collaborator.getRole().isAdvisor()) {
            newRole = CollaboratorRole.PRIMARY_ADVISOR;
            // Rebaixar atual principal para colaborador
            demoteCurrentPrimary(document, CollaboratorRole.PRIMARY_ADVISOR, CollaboratorRole.SECONDARY_ADVISOR);
        } else {
            throw new BusinessRuleException("Este tipo de colaborador não pode ser promovido a principal");
        }
        
        collaborator.setRole(newRole);
        collaborator.setPermission(CollaboratorPermission.FULL_ACCESS);
        collaborator = collaboratorRepository.save(collaborator);
        
        return mapToDTO(collaborator);
    }
    
    
    // =============================================================================
    // MÉTODOS AUXILIARES PRIVADOS
    // =============================================================================
    
    private void validateCollaboratorAddition(Document document, CollaboratorRole role, User user) {
        // Verificar se o usuário tem o papel apropriado no sistema
        if (role.isStudent() && !hasUserRole(user, "STUDENT")) {
            throw new BusinessRuleException("O usuário deve ter papel de STUDENT para ser colaborador estudante");
        }
        
        if (role.isAdvisor() && !hasUserRole(user, "ADVISOR")) {
            throw new BusinessRuleException("O usuário deve ter papel de ADVISOR para ser colaborador orientador");
        }
        
        // Verificar limites
        if (role.isStudent() && !document.canAddMoreStudents()) {
            throw new BusinessRuleException("Limite máximo de estudantes atingido (" + document.getMaxStudents() + ")");
        }
        
        if (role.isAdvisor() && !document.canAddMoreAdvisors()) {
            throw new BusinessRuleException("Limite máximo de orientadores atingido (" + document.getMaxAdvisors() + ")");
        }
        
        // Verificar se já existe um principal do mesmo tipo
        if (role == CollaboratorRole.PRIMARY_STUDENT && document.hasPrimaryStudent()) {
            throw new BusinessRuleException("Já existe um estudante principal. Promova-o ou use outro papel.");
        }
        
        if (role == CollaboratorRole.PRIMARY_ADVISOR && document.hasPrimaryAdvisor()) {
            throw new BusinessRuleException("Já existe um orientador principal. Promova-o ou use outro papel.");
        }
    }
    
    private void validatePermissionChange(DocumentCollaborator collaborator, CollaboratorPermission newPermission) {
        // Principais sempre devem ter acesso completo
        if (collaborator.getRole().isPrimary() && newPermission != CollaboratorPermission.FULL_ACCESS) {
            throw new BusinessRuleException("Colaboradores principais devem manter acesso completo");
        }
        
        // Observer sempre deve ter apenas leitura
        if (collaborator.getRole() == CollaboratorRole.OBSERVER && newPermission != CollaboratorPermission.READ_ONLY) {
            throw new BusinessRuleException("Observadores só podem ter permissão de leitura");
        }
    }
    
    private void validateRoleChange(Document document, DocumentCollaborator collaborator, CollaboratorRole newRole) {
        // Não permitir mudança de tipo (estudante para orientador ou vice-versa)
        if (collaborator.getRole().isStudent() && !newRole.isStudent()) {
            throw new BusinessRuleException("Não é possível mudar um estudante para papel de orientador");
        }
        
        if (collaborator.getRole().isAdvisor() && !newRole.isAdvisor()) {
            throw new BusinessRuleException("Não é possível mudar um orientador para papel de estudante");
        }
        
        // Verificar se já existe principal do novo tipo
        if (newRole == CollaboratorRole.PRIMARY_STUDENT && 
            document.hasPrimaryStudent() && 
            collaborator.getRole() != CollaboratorRole.PRIMARY_STUDENT) {
            throw new BusinessRuleException("Já existe um estudante principal");
        }
        
        if (newRole == CollaboratorRole.PRIMARY_ADVISOR && 
            document.hasPrimaryAdvisor() && 
            collaborator.getRole() != CollaboratorRole.PRIMARY_ADVISOR) {
            throw new BusinessRuleException("Já existe um orientador principal");
        }
    }
    
    private void demoteCurrentPrimary(Document document, CollaboratorRole currentPrimaryRole, CollaboratorRole newRole) {
        Optional<DocumentCollaborator> currentPrimary = document.getCollaborators().stream()
                .filter(c -> c.isActive() && c.getRole() == currentPrimaryRole)
                .findFirst();
        
        if (currentPrimary.isPresent()) {
            DocumentCollaborator primary = currentPrimary.get();
            primary.setRole(newRole);
            primary.setPermission(CollaboratorPermission.READ_WRITE);
            collaboratorRepository.save(primary);
        }
    }
    
    private boolean hasUserRole(User user, String roleName) {
        return user.getRoles().stream()
                .anyMatch(role -> role.getName().equals(roleName));
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
        dto.recalculatePermissions();
        dto.setAddedAt(collaborator.getAddedAt());
        dto.setAddedByName(collaborator.getAddedBy() != null ? collaborator.getAddedBy().getName() : null);
        dto.setActive(collaborator.isActive());
        return dto;
    }
}