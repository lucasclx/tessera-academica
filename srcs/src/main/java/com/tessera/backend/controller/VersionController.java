package com.tessera.backend.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.tessera.backend.dto.VersionDTO;
import com.tessera.backend.entity.User;
import com.tessera.backend.repository.UserRepository;
import com.tessera.backend.service.VersionService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/versions")
public class VersionController {
    
    @Autowired
    private VersionService versionService;
    
    @Autowired
    private UserRepository userRepository;
    
    @PostMapping
    public ResponseEntity<VersionDTO> createVersion(
            @Valid @RequestBody VersionDTO versionDTO,
            Authentication authentication) {
        User currentUser = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado"));
        
        VersionDTO createdVersion = versionService.createVersion(versionDTO, currentUser);
        return new ResponseEntity<>(createdVersion, HttpStatus.CREATED);
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<VersionDTO> getVersion(@PathVariable Long id) {
        return ResponseEntity.ok(versionService.getVersion(id));
    }
    
    @GetMapping("/document/{documentId}")
    public ResponseEntity<List<VersionDTO>> getVersionsByDocument(@PathVariable Long documentId) {
        return ResponseEntity.ok(versionService.getVersionsByDocument(documentId));
    }
    
    @GetMapping("/document/{documentId}/paged")
    public ResponseEntity<Page<VersionDTO>> getVersionsByDocumentPaged(
            @PathVariable Long documentId, 
            Pageable pageable) {
        return ResponseEntity.ok(versionService.getVersionsByDocument(documentId, pageable));
    }
    
    @GetMapping("/document/{documentId}/history")
    public ResponseEntity<List<VersionDTO>> getVersionHistory(@PathVariable Long documentId) {
        return ResponseEntity.ok(versionService.getVersionHistory(documentId));
    }
    
    @GetMapping("/diff/{v1Id}/{v2Id}")
    public ResponseEntity<String> getDiffBetweenVersions(
            @PathVariable Long v1Id, 
            @PathVariable Long v2Id) {
        return ResponseEntity.ok(versionService.getDiffBetweenVersions(v1Id, v2Id));
    }
}