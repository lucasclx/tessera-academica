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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.tessera.backend.dto.CommentDTO;
import com.tessera.backend.entity.User;
import com.tessera.backend.repository.UserRepository;
import com.tessera.backend.service.CommentService;
import com.tessera.backend.exception.ResourceNotFoundException;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/comments")
public class CommentController {
    
    @Autowired
    private CommentService commentService;
    
    @Autowired
    private UserRepository userRepository;
    
    @PostMapping
    public ResponseEntity<CommentDTO> createComment(
            @Valid @RequestBody CommentDTO commentDTO,
            Authentication authentication) {
        User currentUser = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado"));
        
        CommentDTO createdComment = commentService.createComment(commentDTO, currentUser);
        return new ResponseEntity<>(createdComment, HttpStatus.CREATED);
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<CommentDTO> getComment(@PathVariable Long id) {
        return ResponseEntity.ok(commentService.getComment(id));
    }
    
    @GetMapping("/version/{versionId}")
    public ResponseEntity<List<CommentDTO>> getCommentsByVersion(@PathVariable Long versionId) {
        return ResponseEntity.ok(commentService.getCommentsByVersion(versionId));
    }
    
    @GetMapping("/version/{versionId}/resolved")
    public ResponseEntity<List<CommentDTO>> getResolvedCommentsByVersion(
            @PathVariable Long versionId,
            @RequestParam(defaultValue = "false") boolean resolved) {
        return ResponseEntity.ok(commentService.getResolvedCommentsByVersion(versionId, resolved));
    }
    
    @GetMapping("/my")
    public ResponseEntity<Page<CommentDTO>> getMyComments(
            Authentication authentication,
            Pageable pageable) {
        User currentUser = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado"));
        
        return ResponseEntity.ok(commentService.getCommentsByUser(currentUser, pageable));
    }
    
    @GetMapping("/version/{versionId}/position")
    public ResponseEntity<List<CommentDTO>> getCommentsByPosition(
            @PathVariable Long versionId,
            @RequestParam int startPos,
            @RequestParam int endPos) {
        return ResponseEntity.ok(commentService.getCommentsByPosition(versionId, startPos, endPos));
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<CommentDTO> updateComment(
            @PathVariable Long id,
            @Valid @RequestBody CommentDTO commentDTO,
            Authentication authentication) {
        User currentUser = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado"));
        
        return ResponseEntity.ok(commentService.updateComment(id, commentDTO, currentUser));
    }
    
    @PutMapping("/{id}/resolve")
    public ResponseEntity<CommentDTO> resolveComment(
            @PathVariable Long id,
            Authentication authentication) {
        User currentUser = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado"));
        
        return ResponseEntity.ok(commentService.resolveComment(id, currentUser));
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteComment(
            @PathVariable Long id,
            Authentication authentication) {
        User currentUser = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado"));
        
        commentService.deleteComment(id, currentUser);
        return ResponseEntity.noContent().build();
    }
}