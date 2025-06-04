package com.tessera.backend.controller;

import com.tessera.backend.dto.DocumentCollaboratorDTO;
import com.tessera.backend.dto.AddCollaboratorRequestDTO;
import com.tessera.backend.dto.AddCollaboratorsRequestDTO;
import com.tessera.backend.entity.CollaboratorPermission;
import com.tessera.backend.entity.CollaboratorRole;
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
        return userRepository.findByEmail(authentication.getName())
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

    @PostMapping("/bulk")
    @Operation(summary = "Adicionar colaboradores em lote", description = "Adiciona múltiplos colaboradores ao documento")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "201", description = "Colaboradores adicionados com sucesso"),
        @ApiResponse(responseCode = "400", description = "Dados inválidos ou regras de negócio violadas"),
        @ApiResponse(responseCode = "404", description = "Documento ou usuário não encontrado"),
        @ApiResponse(responseCode = "403", description = "Sem permissão para gerenciar colaboradores")
    })
    public ResponseEntity<List<DocumentCollaboratorDTO>> addCollaborators(
            @Parameter(description = "ID do documento")
            @PathVariable Long documentId,
            @Parameter(description = "Lista de colaboradores a serem adicionados")
            @Valid @RequestBody AddCollaboratorsRequestDTO request,
            Authentication authentication) {
        User currentUser = getCurrentUser(authentication);
        List<DocumentCollaboratorDTO> collaborators = collaboratorService.addCollaborators(documentId, request.getCollaborators(), currentUser);
        return new ResponseEntity<>(collaborators, HttpStatus.CREATED);
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
    
    @PutMapping("/{collaboratorId}/role")
    @Operation(summary = "Atualizar papel", description = "Atualiza o papel de um colaborador")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Papel atualizado com sucesso"),
        @ApiResponse(responseCode = "404", description = "Colaborador não encontrado"),
        @ApiResponse(responseCode = "403", description = "Sem permissão para gerenciar colaboradores"),
        @ApiResponse(responseCode = "400", description = "Não é possível alterar o papel deste colaborador")
    })
    public ResponseEntity<DocumentCollaboratorDTO> updateRole(
            @Parameter(description = "ID do documento") 
            @PathVariable Long documentId,
            @Parameter(description = "ID do colaborador") 
            @PathVariable Long collaboratorId,
            @Parameter(description = "Novo papel") 
            @RequestBody CollaboratorRole newRole,
            Authentication authentication) {
        User currentUser = getCurrentUser(authentication);
        DocumentCollaboratorDTO updatedCollaborator = collaboratorService.updateCollaboratorRole(
                collaboratorId, newRole, currentUser);
        return ResponseEntity.ok(updatedCollaborator);
    }
    
    @PutMapping("/{collaboratorId}/promote")
    @Operation(summary = "Promover a principal", description = "Promove um colaborador a papel principal")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Colaborador promovido com sucesso"),
        @ApiResponse(responseCode = "404", description = "Colaborador não encontrado"),
        @ApiResponse(responseCode = "403", description = "Sem permissão para gerenciar colaboradores"),
        @ApiResponse(responseCode = "400", description = "Não é possível promover este colaborador")
    })
    public ResponseEntity<DocumentCollaboratorDTO> promoteToPrimary(
            @Parameter(description = "ID do documento") 
            @PathVariable Long documentId,
            @Parameter(description = "ID do colaborador") 
            @PathVariable Long collaboratorId,
            Authentication authentication) {
        User currentUser = getCurrentUser(authentication);
        DocumentCollaboratorDTO promotedCollaborator = collaboratorService.promoteToPrimary(
                collaboratorId, currentUser);
        return ResponseEntity.ok(promotedCollaborator);
    }
    
}
