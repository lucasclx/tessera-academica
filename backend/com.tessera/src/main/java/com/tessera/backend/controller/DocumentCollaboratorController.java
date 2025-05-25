// CONTROLLER: DocumentCollaboratorController.java
package com.tessera.backend.controller;

import com.tessera.backend.dto.DocumentCollaboratorDTO;
import com.tessera.backend.dto.AddCollaboratorRequestDTO;
import com.tessera.backend.entity.CollaboratorPermission;
import com.tessera.backend.entity.User;
import com.tessera.backend.repository.UserRepository;
import com.tessera.backend.service.DocumentCollaboratorService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/documents/{documentId}/collaborators")
@Tag(name = "Colaboradores", description = "Operações relacionadas aos colaboradores de documentos")
public class DocumentCollaboratorController {
    
    @Autowired
    private DocumentCollaboratorService collaboratorService;
    
    @Autowired
    private UserRepository userRepository;

    private User getCurrentUser(Authentication authentication) {
        return false;
    }
    
    /**
     * Verifica se o usuário pode acessar um documento (atualizado para colaboradores)
     */
    public boolean canAccessDocument(User user, Document document) {
        if (user == null || document == null) {
            return false;
        }
        
        // Admin pode acessar qualquer documento
        if (hasRole(user, "ADMIN")) {
            return true;
        }
        
        // Verificar se é colaborador ativo
        if (document.hasCollaborator(user)) {
            return true;
        }
        
        // Fallback para sistema antigo
        if ((document.getStudent() != null && document.getStudent().getId().equals(user.getId())) ||
            (document.getAdvisor() != null && document.getAdvisor().getId().equals(user.getId()))) {
            return true;
        }
        
        return false;
    }
    
    /**
     * Verifica se o usuário pode editar um documento (atualizado para colaboradores)
     */
    public boolean canEditDocument(User user, Document document) {
        if (user == null || document == null) {
            return false;
        }
        
        // Admin pode editar qualquer documento
        if (hasRole(user, "ADMIN")) {
            return true;
        }
        
        // Verificar permissões de colaborador
        if (document.canUserEdit(user)) {
            // Verificar status do documento - só pode editar em DRAFT ou REVISION
            DocumentStatus status = document.getStatus();
            return (status == DocumentStatus.DRAFT || status == DocumentStatus.REVISION);
        }
        
        return false;
    }
    
    // ... resto dos métodos existentes ...
} userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new RuntimeException("Usuário não autenticado"));
    }
    
    @GetMapping
    @Operation(summary = "Listar colaboradores", description = "Lista todos os colaboradores ativos de um documento")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Lista de colaboradores retornada com sucesso"),
        @ApiResponse(responseCode = "404", description = "Documento não encontrado"),
        @ApiResponse(responseCode = "403", description = "Sem permissão para visualizar colaboradores")
    })
    public ResponseEntity<List<DocumentCollaboratorDTO>> getCollaborators(
            @Parameter(description = "ID do documento") 
            @PathVariable Long documentId) {
        List<DocumentCollaboratorDTO> collaborators = collaboratorService.getDocumentCollaborators(documentId);
        return ResponseEntity.ok(collaborators);
    }
    
    @PostMapping
    @Operation(summary = "Adicionar colaborador", description = "Adiciona um novo colaborador ao documento")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "201", description = "Colaborador adicionado com sucesso"),
        @ApiResponse(responseCode = "400", description = "Dados inválidos ou regras de negócio violadas"),
        @ApiResponse(responseCode = "404", description = "Documento ou usuário não encontrado"),
        @ApiResponse(responseCode = "403", description = "Sem permissão para gerenciar colaboradores")
    })
    public ResponseEntity<DocumentCollaboratorDTO> addCollaborator(
            @Parameter(description = "ID do documento") 
            @PathVariable Long documentId,
            @Parameter(description = "Dados do colaborador a ser adicionado")
            @Valid @RequestBody AddCollaboratorRequestDTO request,
            Authentication authentication) {
        User currentUser = getCurrentUser(authentication);
        DocumentCollaboratorDTO collaborator = collaboratorService.addCollaborator(documentId, request, currentUser);
        return new ResponseEntity<>(collaborator, HttpStatus.CREATED);
    }
    
    @DeleteMapping("/{collaboratorId}")
    @Operation(summary = "Remover colaborador", description = "Remove um colaborador do documento")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "204", description = "Colaborador removido com sucesso"),
        @ApiResponse(responseCode = "404", description = "Colaborador não encontrado"),
        @ApiResponse(responseCode = "403", description = "Sem permissão para gerenciar colaboradores"),
        @ApiResponse(responseCode = "400", description = "Não é possível remover este colaborador")
    })
    public ResponseEntity<Void> removeCollaborator(
            @Parameter(description = "ID do documento") 
            @PathVariable Long documentId,
            @Parameter(description = "ID do colaborador") 
            @PathVariable Long collaboratorId,
            Authentication authentication) {
        User currentUser = getCurrentUser(authentication);
        collaboratorService.removeCollaborator(documentId, collaboratorId, currentUser);
        return ResponseEntity.noContent().build();
    }
    
    @PutMapping("/{collaboratorId}/permissions")
    @Operation(summary = "Atualizar permissões", description = "Atualiza as permissões de um colaborador")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Permissões atualizadas com sucesso"),
        @ApiResponse(responseCode = "404", description = "Colaborador não encontrado"),
        @ApiResponse(responseCode = "403", description = "Sem permissão para gerenciar colaboradores"),
        @ApiResponse(responseCode = "400", description = "Não é possível alterar permissões deste colaborador")
    })
    public ResponseEntity<DocumentCollaboratorDTO> updatePermissions(
            @Parameter(description = "ID do documento") 
            @PathVariable Long documentId,
            @Parameter(description = "ID do colaborador") 
            @PathVariable Long collaboratorId,
            @Parameter(description = "Nova permissão") 
            @RequestBody CollaboratorPermission newPermission,
            Authentication authentication) {
        User currentUser = getCurrentUser(authentication);
        DocumentCollaboratorDTO updatedCollaborator = collaboratorService.updateCollaboratorPermissions(
                collaboratorId, newPermission, currentUser);
        return ResponseEntity.ok(updatedCollaborator);
    }
    
    @PostMapping("/migrate")
    @Operation(summary = "Migrar documentos existentes", 
               description = "Migra documentos existentes para o novo sistema de colaboradores (apenas admin)")
    @ApiResponse(responseCode = "200", description = "Migração executada com sucesso")
    public ResponseEntity<String> migrateExistingDocuments(Authentication authentication) {
        User currentUser = getCurrentUser(authentication);
        
        // Verificar se é admin
        boolean isAdmin = currentUser.getRoles().stream()
                .anyMatch(role -> role.getName().equals("ADMIN"));
        
        if (!isAdmin) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body("Apenas administradores podem executar a migração");
        }
        
        collaboratorService.migrateExistingDocuments();
        return ResponseEntity.ok("Migração executada com sucesso");
    }
}

// ATUALIZAÇÃO: AuthorizationService.java (adicionar métodos para colaboradores)
package com.tessera.backend.service;

import com.tessera.backend.entity.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class AuthorizationService {
    
    // ... métodos existentes ...
    
    /**
     * Verifica se o usuário pode gerenciar colaboradores do documento
     */
    public boolean canManageCollaborators(User user, Document document) {
        if (user == null || document == null) {
            return false;
        }
        
        // Admin pode gerenciar qualquer documento
        if (hasRole(user, "ADMIN")) {
            return true;
        }
        
        // Verificar se é colaborador com permissão de gerenciamento
        DocumentCollaborator collaborator = document.getCollaborator(user);
        if (collaborator != null && collaborator.getPermission().canManageCollaborators()) {
            return true;
        }
        
        // Fallback para sistema antigo - proprietário original
        if (document.getStudent() != null && document.getStudent().getId().equals(user.getId())) {
            return true;
        }
        
        return