package com.tessera.backend.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
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
    
    @PostMapping
    public ResponseEntity<DocumentDTO> createDocument(
            @Valid @RequestBody DocumentDTO documentDTO,
            Authentication authentication) {
        User currentUser = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado"));
        
        DocumentDTO createdDocument = documentService.createDocument(documentDTO, currentUser);
        return new ResponseEntity<>(createdDocument, HttpStatus.CREATED);
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<DocumentDTO> getDocument(@PathVariable Long id) {
        return ResponseEntity.ok(documentService.getDocument(id));
    }
    
    @GetMapping("/student")
    public ResponseEntity<List<DocumentDTO>> getMyDocuments(Authentication authentication) {
        User currentUser = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado"));
        
        return ResponseEntity.ok(documentService.getDocumentsByStudent(currentUser));
    }
    
    @GetMapping("/advisor")
    public ResponseEntity<List<DocumentDTO>> getMyAdvisingDocuments(Authentication authentication) {
        User currentUser = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado"));
        
        return ResponseEntity.ok(documentService.getDocumentsByAdvisor(currentUser));
    }
    
    @GetMapping("/student/paged")
    public ResponseEntity<Page<DocumentDTO>> getMyDocumentsPaged(
            Authentication authentication, 
            Pageable pageable) {
        User currentUser = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado"));
        
        return ResponseEntity.ok(documentService.getDocumentsByStudent(currentUser, pageable));
    }
    
    @GetMapping("/advisor/paged")
    public ResponseEntity<Page<DocumentDTO>> getMyAdvisingDocumentsPaged(
            Authentication authentication, 
            Pageable pageable) {
        User currentUser = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado"));
        
        return ResponseEntity.ok(documentService.getDocumentsByAdvisor(currentUser, pageable));
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<DocumentDTO> updateDocument(
            @PathVariable Long id,
            @Valid @RequestBody DocumentDTO documentDTO,
            Authentication authentication) {
        User currentUser = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado"));
        
        return ResponseEntity.ok(documentService.updateDocument(id, documentDTO, currentUser));
    }
    
    @PutMapping("/{id}/status/{status}")
    public ResponseEntity<DocumentDTO> changeStatus(
            @PathVariable Long id,
            @PathVariable DocumentStatus status,
            @RequestBody(required = false) String reason,
            Authentication authentication) {
        User currentUser = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado"));
        
        return ResponseEntity.ok(documentService.changeStatus(id, status, currentUser, reason));
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteDocument(
            @PathVariable Long id,
            Authentication authentication) {
        User currentUser = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado"));
        
        documentService.deleteDocument(id, currentUser);
        return ResponseEntity.noContent().build();
    }
}