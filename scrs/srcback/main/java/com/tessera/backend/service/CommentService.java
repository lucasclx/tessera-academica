package com.tessera.backend.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.tessera.backend.dto.CommentDTO;
import com.tessera.backend.entity.Comment;
import com.tessera.backend.entity.Document;
import com.tessera.backend.entity.User;
import com.tessera.backend.entity.Version;
import com.tessera.backend.exception.ResourceNotFoundException;
import com.tessera.backend.repository.CommentRepository;
import com.tessera.backend.repository.VersionRepository;

@Service
public class CommentService {
    
    @Autowired
    private CommentRepository commentRepository;
    
    @Autowired
    private VersionRepository versionRepository;
    
    @Transactional
    public CommentDTO createComment(CommentDTO commentDTO, User currentUser) {
        Version version = versionRepository.findById(commentDTO.getVersionId())
                .orElseThrow(() -> new ResourceNotFoundException("Versão não encontrada"));
        
        Document document = version.getDocument();
        
        // Verificar permissões - apenas orientador e aluno podem comentar
        if (!currentUser.getId().equals(document.getStudent().getId()) && 
            !currentUser.getId().equals(document.getAdvisor().getId())) {
            throw new RuntimeException("Você não tem permissão para comentar nesta versão");
        }
        
        Comment comment = new Comment();
        comment.setVersion(version);
        comment.setUser(currentUser);
        comment.setContent(commentDTO.getContent());
        comment.setStartPosition(commentDTO.getStartPosition());
        comment.setEndPosition(commentDTO.getEndPosition());
        
        comment = commentRepository.save(comment);
        
        return mapToDTO(comment);
    }
    
    public CommentDTO getComment(Long id) {
        Comment comment = commentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Comentário não encontrado"));
        
        return mapToDTO(comment);
    }
    
    public List<CommentDTO> getCommentsByVersion(Long versionId) {
        Version version = versionRepository.findById(versionId)
                .orElseThrow(() -> new ResourceNotFoundException("Versão não encontrada"));
        
        return commentRepository.findByVersionOrderByCreatedAtDesc(version).stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }
    
    public List<CommentDTO> getResolvedCommentsByVersion(Long versionId, boolean resolved) {
        Version version = versionRepository.findById(versionId)
                .orElseThrow(() -> new ResourceNotFoundException("Versão não encontrada"));
        
        return commentRepository.findByVersionAndResolvedOrderByCreatedAtDesc(version, resolved).stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }
    
    public Page<CommentDTO> getCommentsByUser(User user, Pageable pageable) {
        return commentRepository.findByUserOrderByCreatedAtDesc(user, pageable)
                .map(this::mapToDTO);
    }
    
    public List<CommentDTO> getCommentsByPosition(Long versionId, int startPos, int endPos) {
        Version version = versionRepository.findById(versionId)
                .orElseThrow(() -> new ResourceNotFoundException("Versão não encontrada"));
        
        return commentRepository.findByVersionAndStartPositionGreaterThanEqualAndEndPositionLessThanEqual(
                version, startPos, endPos).stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }
    
    @Transactional
    public CommentDTO updateComment(Long id, CommentDTO commentDTO, User currentUser) {
        Comment comment = commentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Comentário não encontrado"));
        
        // Apenas o autor do comentário pode editá-lo
        if (!currentUser.getId().equals(comment.getUser().getId())) {
            throw new RuntimeException("Você não tem permissão para editar este comentário");
        }
        
        comment.setContent(commentDTO.getContent());
        comment.setStartPosition(commentDTO.getStartPosition());
        comment.setEndPosition(commentDTO.getEndPosition());
        
        return mapToDTO(commentRepository.save(comment));
    }
    
    @Transactional
    public CommentDTO resolveComment(Long id, User currentUser) {
        Comment comment = commentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Comentário não encontrado"));
        
        Document document = comment.getVersion().getDocument();
        
        // Verificar permissões - apenas orientador e aluno podem resolver comentários
        if (!currentUser.getId().equals(document.getStudent().getId()) && 
            !currentUser.getId().equals(document.getAdvisor().getId())) {
            throw new RuntimeException("Você não tem permissão para resolver este comentário");
        }
        
        comment.setResolved(true);
        comment.setResolvedAt(LocalDateTime.now());
        comment.setResolvedBy(currentUser);
        
        return mapToDTO(commentRepository.save(comment));
    }
    
    @Transactional
    public void deleteComment(Long id, User currentUser) {
        Comment comment = commentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Comentário não encontrado"));
        
        // Apenas o autor do comentário pode excluí-lo
        if (!currentUser.getId().equals(comment.getUser().getId())) {
            throw new RuntimeException("Você não tem permissão para excluir este comentário");
        }
        
        commentRepository.delete(comment);
    }
    
    private CommentDTO mapToDTO(Comment comment) {
        CommentDTO dto = new CommentDTO();
        dto.setId(comment.getId());
        dto.setVersionId(comment.getVersion().getId());
        dto.setContent(comment.getContent());
        dto.setStartPosition(comment.getStartPosition());
        dto.setEndPosition(comment.getEndPosition());
        dto.setResolved(comment.isResolved());
        dto.setResolvedAt(comment.getResolvedAt());
        
        if (comment.getResolvedBy() != null) {
            dto.setResolvedById(comment.getResolvedBy().getId());
            dto.setResolvedByName(comment.getResolvedBy().getName());
        }
        
        dto.setUserId(comment.getUser().getId());
        dto.setUserName(comment.getUser().getName());
        dto.setCreatedAt(comment.getCreatedAt());
        dto.setUpdatedAt(comment.getUpdatedAt());
        
        return dto;
    }
}