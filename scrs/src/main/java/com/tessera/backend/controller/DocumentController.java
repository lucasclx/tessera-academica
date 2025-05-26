package com.tessera.backend.controller;

import com.tessera.backend.dto.DocumentDTO;
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
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
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
        return userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new RuntimeException("Usuário não autenticado ou não encontrado"));
    }
    
    @PostMapping
    @Operation(summary = "Criar novo documento", description = "Cria um novo documento acadêmico")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "201", description = "Documento criado com sucesso"),
        @ApiResponse(responseCode = "400", description = "Dados inválidos"),
        @ApiResponse(responseCode = "403", description = "Sem permissão para criar documento para este estudante"),
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
    @Operation(summary = "Obter documento por ID", description = "Retorna os detalhes de um documento específico")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Documento encontrado"),
        @ApiResponse(responseCode = "404", description = "Documento não encontrado")
    })
    public ResponseEntity<DocumentDTO> getDocument(
            @Parameter(description = "ID do documento") 
            @PathVariable Long id) {
        return ResponseEntity.ok(documentService.getDocument(id));
    }
    
    @GetMapping("/student")
    @Operation(summary = "Listar documentos do estudante", 
               description = "Retorna documentos do estudante atual com filtros e paginação")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Lista de documentos retornada com sucesso")
    })
    public ResponseEntity<Page<DocumentDTO>> getMyDocuments(
            Authentication authentication,
            @Parameter(description = "Termo de busca (título ou descrição)") 
            @RequestParam(required = false) String searchTerm,
            @Parameter(description = "Filtro por status (ALL, DRAFT, SUBMITTED, REVISION, APPROVED, FINALIZED)") 
            @RequestParam(required = false, defaultValue = "ALL") String status,
            @Parameter(description = "Parâmetros de paginação e ordenação") 
            @PageableDefault(sort = "updatedAt,desc") Pageable pageable) {
        User currentUser = getCurrentUser(authentication);
        return ResponseEntity.ok(documentService.getDocumentsByStudentWithFilters(currentUser, searchTerm, status, pageable));
    }
    
    @GetMapping("/advisor")
    @Operation(summary = "Listar documentos do orientador", 
               description = "Retorna documentos orientados pelo usuário atual com filtros e paginação")
    public ResponseEntity<Page<DocumentDTO>> getMyAdvisingDocuments(
            Authentication authentication,
            @Parameter(description = "Termo de busca (título, descrição ou nome do estudante)") 
            @RequestParam(required = false) String searchTerm,
            @Parameter(description = "Filtro por status") 
            @RequestParam(required = false, defaultValue = "ALL") String status,
            @PageableDefault(sort = "updatedAt,desc") Pageable pageable) {
        User currentUser = getCurrentUser(authentication);
        return ResponseEntity.ok(documentService.getDocumentsByAdvisorWithFilters(currentUser, searchTerm, status, pageable));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Atualizar documento", description = "Atualiza os dados de um documento existente")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Documento atualizado com sucesso"),
        @ApiResponse(responseCode = "403", description = "Sem permissão para atualizar este documento"),
        @ApiResponse(responseCode = "404", description = "Documento não encontrado")
    })
    public ResponseEntity<DocumentDTO> updateDocument(
            @Parameter(description = "ID do documento") 
            @PathVariable Long id,
            @Parameter(description = "Novos dados do documento") 
            @Valid @RequestBody DocumentDTO documentDTO,
            Authentication authentication) {
        User currentUser = getCurrentUser(authentication);
        return ResponseEntity.ok(documentService.updateDocument(id, documentDTO, currentUser));
    }
    
    @PutMapping("/{id}/status/{status}")
    @Operation(summary = "Alterar status do documento", 
               description = "Altera o status de um documento (submeter, aprovar, solicitar revisão, etc.)")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Status alterado com sucesso"),
        @ApiResponse(responseCode = "403", description = "Sem permissão para alterar status"),
        @ApiResponse(responseCode = "404", description = "Documento não encontrado"),
        @ApiResponse(responseCode = "400", description = "Transição de status inválida")
    })
    public ResponseEntity<DocumentDTO> changeStatus(
            @Parameter(description = "ID do documento") 
            @PathVariable Long id,
            @Parameter(description = "Novo status do documento") 
            @PathVariable DocumentStatus status,
            @Parameter(description = "Motivo da alteração (opcional, para revisões)") 
            @RequestBody(required = false) String reason,
            Authentication authentication) {
        User currentUser = getCurrentUser(authentication);
        return ResponseEntity.ok(documentService.changeStatus(id, status, currentUser, reason));
    }
    
    @DeleteMapping("/{id}")
    @Operation(summary = "Excluir documento", 
               description = "Exclui um documento (apenas rascunhos podem ser excluídos)")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "204", description = "Documento excluído com sucesso"),
        @ApiResponse(responseCode = "403", description = "Sem permissão para excluir documento"),
        @ApiResponse(responseCode = "404", description = "Documento não encontrado"),
        @ApiResponse(responseCode = "400", description = "Documento não pode ser excluído (não está em rascunho)")
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