package com.tessera.backend.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.tessera.backend.dto.DocumentDTO;
import com.tessera.backend.entity.DocumentStatus;
import com.tessera.backend.entity.User;
import com.tessera.backend.repository.UserRepository;
import com.tessera.backend.service.DocumentService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/documents")
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
    public ResponseEntity<DocumentDTO> createDocument(
            @Valid @RequestBody DocumentDTO documentDTO,
            Authentication authentication) {
        User currentUser = getCurrentUser(authentication);
        DocumentDTO createdDocument = documentService.createDocument(documentDTO, currentUser);
        return new ResponseEntity<>(createdDocument, HttpStatus.CREATED);
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<DocumentDTO> getDocument(@PathVariable Long id) {
        return ResponseEntity.ok(documentService.getDocument(id));
    }
    
    // Endpoint para listar documentos do estudante com filtros e paginação
    @GetMapping("/student")
    public ResponseEntity<Page<DocumentDTO>> getMyDocuments(
            Authentication authentication,
            @RequestParam(required = false) String searchTerm,
            @RequestParam(required = false, defaultValue = "ALL") String status,
            @PageableDefault(sort = "updatedAt,desc") Pageable pageable) {
        User currentUser = getCurrentUser(authentication);
        return ResponseEntity.ok(documentService.getDocumentsByStudentWithFilters(currentUser, searchTerm, status, pageable));
    }
    
    // Endpoint para listar documentos do orientador com filtros e paginação
    @GetMapping("/advisor")
    public ResponseEntity<Page<DocumentDTO>> getMyAdvisingDocuments(
            Authentication authentication,
            @RequestParam(required = false) String searchTerm,
            @RequestParam(required = false, defaultValue = "ALL") String status,
            @PageableDefault(sort = "updatedAt,desc") Pageable pageable) {
        User currentUser = getCurrentUser(authentication);
        return ResponseEntity.ok(documentService.getDocumentsByAdvisorWithFilters(currentUser, searchTerm, status, pageable));
    }
    
    // Os endpoints /student/paged e /advisor/paged podem ser removidos se os acima os substituírem completamente
    // ou mantidos por compatibilidade se forem usados em algum lugar sem os filtros.
    // Para este exemplo, vamos assumir que os novos endpoints com filtros são os principais.
    // Se precisar mantê-los, seria algo como:
    /*
    @GetMapping("/student/paged")
    public ResponseEntity<Page<DocumentDTO>> getMyDocumentsPaged(
            Authentication authentication, 
            @PageableDefault(sort = "updatedAt,desc") Pageable pageable) {
        User currentUser = getCurrentUser(authentication);
        // Chamar um método em DocumentService que não aplica searchTerm ou status, ou passar null para eles.
        return ResponseEntity.ok(documentService.getDocumentsByStudentWithFilters(currentUser, null, "ALL", pageable));
    }
    
    @GetMapping("/advisor/paged")
    public ResponseEntity<Page<DocumentDTO>> getMyAdvisingDocumentsPaged(
            Authentication authentication, 
            @PageableDefault(sort = "updatedAt,desc") Pageable pageable) {
        User currentUser = getCurrentUser(authentication);
        return ResponseEntity.ok(documentService.getDocumentsByAdvisorWithFilters(currentUser, null, "ALL", pageable));
    }
    */

    @PutMapping("/{id}")
    public ResponseEntity<DocumentDTO> updateDocument(
            @PathVariable Long id,
            @Valid @RequestBody DocumentDTO documentDTO,
            Authentication authentication) {
        User currentUser = getCurrentUser(authentication);
        return ResponseEntity.ok(documentService.updateDocument(id, documentDTO, currentUser));
    }
    
    @PutMapping("/{id}/status/{status}")
    public ResponseEntity<DocumentDTO> changeStatus(
            @PathVariable Long id,
            @PathVariable DocumentStatus status,
            @RequestBody(required = false) String reason, // Considerar um DTO se mais campos forem necessários
            Authentication authentication) {
        User currentUser = getCurrentUser(authentication);
        return ResponseEntity.ok(documentService.changeStatus(id, status, currentUser, reason));
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteDocument(
            @PathVariable Long id,
            Authentication authentication) {
        User currentUser = getCurrentUser(authentication);
        documentService.deleteDocument(id, currentUser);
        return ResponseEntity.noContent().build();
    }
}