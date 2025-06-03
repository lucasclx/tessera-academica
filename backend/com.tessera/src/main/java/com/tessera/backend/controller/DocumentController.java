package com.tessera.backend.controller;

import com.tessera.backend.dto.DocumentDTO;
import com.tessera.backend.dto.DocumentDetailDTO;
import com.tessera.backend.entity.DocumentStatus;
import com.tessera.backend.entity.User;
import com.tessera.backend.repository.UserRepository;
import com.tessera.backend.service.DocumentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort; // Importar Sort
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.access.prepost.PreAuthorize; // Para controle de acesso mais fino se necessário
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/documents")
@Tag(name = "Documentos", description = "Operações relacionadas ao gerenciamento de documentos acadêmicos")
public class DocumentController {
    
    @Autowired
    private DocumentService documentService;
    
    @Autowired
    private UserRepository userRepository;

    private User getCurrentUser(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new RuntimeException("Usuário não autenticado.");
        }
        return userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new RuntimeException("Usuário autenticado não encontrado no banco de dados."));
    }
    
    @PostMapping
    @PreAuthorize("hasRole('STUDENT') or hasRole('ADMIN')") // Apenas estudantes ou admins podem criar documentos
    @Operation(summary = "Criar novo documento", description = "Cria um novo documento acadêmico. Estudantes só podem criar para si mesmos, admins podem especificar o estudante.")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "201", description = "Documento criado com sucesso"),
        @ApiResponse(responseCode = "400", description = "Dados inválidos"),
        @ApiResponse(responseCode = "403", description = "Sem permissão para criar documento para este estudante (se studentId for fornecido e não for o próprio usuário ou admin)"),
        @ApiResponse(responseCode = "404", description = "Estudante ou orientador não encontrado")
    })
    public ResponseEntity<DocumentDTO> createDocument(
            @Parameter(description = "Dados do documento a ser criado") 
            @Valid @RequestBody DocumentDTO documentDTO,
            Authentication authentication) {
        User currentUser = getCurrentUser(authentication);
        DocumentDTO createdDocument = documentService.createDocument(documentDTO, currentUser);
        return new ResponseEntity<>(createdDocument, HttpStatus.CREATED);
    }
    
    @GetMapping("/{id}")
    @PreAuthorize("@authorizationService.hasDocumentAccess(authentication, #id)") // Exemplo de verificação de acesso
    @Operation(summary = "Obter documento por ID", description = "Retorna os detalhes de um documento específico se o usuário tiver acesso.")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Documento encontrado"),
        @ApiResponse(responseCode = "403", description = "Acesso negado ao documento"),
        @ApiResponse(responseCode = "404", description = "Documento não encontrado")
    })
    public ResponseEntity<DocumentDetailDTO> getDocumentById( // Renomeado para evitar conflito com get() do Spring Data
            @Parameter(description = "ID do documento")
            @PathVariable Long id,
            Authentication authentication) {
        User currentUser = getCurrentUser(authentication);
        return ResponseEntity.ok(documentService.getDocumentDetail(id, currentUser));
    }
    
    @GetMapping("/student")
    @PreAuthorize("hasRole('STUDENT')")
    @Operation(summary = "Listar documentos do estudante", 
               description = "Retorna documentos do estudante atual (onde ele é colaborador) com filtros e paginação.")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Lista de documentos retornada com sucesso")
    })
    public ResponseEntity<Page<DocumentDTO>> getMyStudentDocuments( // Renomeado para clareza
            Authentication authentication,
            @Parameter(description = "Termo de busca (título ou descrição)") 
            @RequestParam(required = false) String searchTerm,
            @Parameter(description = "Filtro por status (ALL, DRAFT, SUBMITTED, REVISION, APPROVED, FINALIZED)") 
            @RequestParam(required = false, defaultValue = "ALL") String status,
            @Parameter(description = "Parâmetros de paginação e ordenação") 
            @PageableDefault(sort = "updatedAt", direction = Sort.Direction.DESC) Pageable pageable) { // CORRIGIDO AQUI
        User currentUser = getCurrentUser(authentication);
        // documentService.getDocumentsByStudentWithFilters foi atualizado para usar colaborador
        return ResponseEntity.ok(documentService.getDocumentsByCollaborator(currentUser, searchTerm, status, pageable));
    }
    
    @GetMapping("/advisor")
    @PreAuthorize("hasRole('ADVISOR')")
    @Operation(summary = "Listar documentos do orientador", 
               description = "Retorna documentos orientados pelo usuário atual (onde ele é colaborador orientador) com filtros e paginação.")
    public ResponseEntity<Page<DocumentDTO>> getMyAdvisingDocuments(
            Authentication authentication,
            @Parameter(description = "Termo de busca (título, descrição ou nome do estudante)") 
            @RequestParam(required = false) String searchTerm,
            @Parameter(description = "Filtro por status") 
            @RequestParam(required = false, defaultValue = "ALL") String status,
            @PageableDefault(sort = "updatedAt", direction = Sort.Direction.DESC) Pageable pageable) { // CORRIGIDO AQUI
        User currentUser = getCurrentUser(authentication);
        // documentService.getDocumentsByAdvisorWithFilters foi atualizado para usar colaborador
        return ResponseEntity.ok(documentService.getDocumentsByCollaborator(currentUser, searchTerm, status, pageable));
    }

    @PutMapping("/{id}")
    @PreAuthorize("@authorizationService.canEditDocument(authentication, #id)") // Exemplo de verificação de permissão
    @Operation(summary = "Atualizar informações básicas do documento", description = "Atualiza título, descrição e orientador principal de um documento existente.")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Documento atualizado com sucesso"),
        @ApiResponse(responseCode = "403", description = "Sem permissão para atualizar este documento"),
        @ApiResponse(responseCode = "404", description = "Documento não encontrado")
    })
    public ResponseEntity<DocumentDTO> updateDocument(
            @Parameter(description = "ID do documento") 
            @PathVariable Long id,
            @Parameter(description = "Novos dados do documento (título, descrição, advisorId)") 
            @Valid @RequestBody DocumentDTO documentDTO, // O DTO pode ser um específico para update, e.g., UpdateDocumentInfoDTO
            Authentication authentication) {
        User currentUser = getCurrentUser(authentication);
        return ResponseEntity.ok(documentService.updateDocument(id, documentDTO, currentUser));
    }
    
    @PutMapping("/{id}/status/{newStatusValue}") // Usar newStatusValue para evitar conflito com o status do @RequestParam
    @PreAuthorize("@authorizationService.canChangeDocumentStatus(authentication, #id)") // Exemplo
    @Operation(summary = "Alterar status do documento", 
               description = "Altera o status de um documento (ex: submeter, aprovar, solicitar revisão).")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Status alterado com sucesso"),
        @ApiResponse(responseCode = "403", description = "Sem permissão para alterar status neste momento ou para este documento"),
        @ApiResponse(responseCode = "404", description = "Documento não encontrado"),
        @ApiResponse(responseCode = "400", description = "Transição de status inválida ou motivo ausente quando necessário")
    })
    public ResponseEntity<DocumentDTO> changeDocumentStatus( // Renomeado para clareza
            @Parameter(description = "ID do documento") 
            @PathVariable Long id,
            @Parameter(description = "Novo status do documento (DRAFT, SUBMITTED, REVISION, APPROVED, FINALIZED)") 
            @PathVariable("newStatusValue") DocumentStatus newStatus, // Recebe o enum diretamente
            @Parameter(description = "Motivo da alteração (obrigatório para REVISION, opcional para outros)") 
            @RequestBody(required = false) String reason, // Pode ser um DTO { "reason": "..." }
            Authentication authentication) {
        User currentUser = getCurrentUser(authentication);
        return ResponseEntity.ok(documentService.changeStatus(id, newStatus, currentUser, reason));
    }
    
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or @authorizationService.canDeleteDocument(authentication, #id)") // Exemplo
    @Operation(summary = "Excluir documento", 
               description = "Exclui um documento. Geralmente permitido apenas para rascunhos pelo estudante principal ou admin.")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "204", description = "Documento excluído com sucesso"),
        @ApiResponse(responseCode = "403", description = "Sem permissão para excluir este documento"),
        @ApiResponse(responseCode = "404", description = "Documento não encontrado"),
        @ApiResponse(responseCode = "400", description = "Documento não pode ser excluído (não está em rascunho ou outra regra de negócio)")
    })
    public ResponseEntity<Void> deleteDocument(
            @Parameter(description = "ID do documento") 
            @PathVariable Long id,
            Authentication authentication) {
        User currentUser = getCurrentUser(authentication);
        documentService.deleteDocument(id, currentUser);
        return ResponseEntity.noContent().build();
    }
}