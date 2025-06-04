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
    
    @Autowired
    private NotificationEventService notificationEventService;
    
    @Transactional
    public CommentDTO createComment(CommentDTO commentDTO, User currentUser) {
        Version version = versionRepository.findById(commentDTO.getVersionId())
                .orElseThrow(() -> new ResourceNotFoundException("Versão não encontrada"));
        
        Document document = version.getDocument();
        
        // Verificar permissões - apenas colaboradores estudantes ou orientadores podem comentar
        boolean allowed = document.getCollaborator(currentUser)
                .map(c -> c.getRole().isStudent() || c.getRole().isAdvisor())
                .orElse(false);
        if (!allowed) {
            throw new RuntimeException("Você não tem permissão para comentar nesta versão");
        }
        
        Comment comment = new Comment();
        comment.setVersion(version);
        comment.setUser(currentUser);
        comment.setContent(commentDTO.getContent());
        comment.setStartPosition(commentDTO.getStartPosition());
        comment.setEndPosition(commentDTO.getEndPosition());
        
        comment = commentRepository.save(comment);
        
        // Disparar evento de notificação
        notificationEventService.onCommentAdded(comment, currentUser);
        
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
        
        List<Comment> comments = commentRepository.findByVersionOrderByCreatedAtDesc(version);
        return comments.stream().map(this::mapToDTO).collect(Collectors.toList());
    }
    
    public List<CommentDTO> getResolvedCommentsByVersion(Long versionId, boolean resolved) {
        Version version = versionRepository.findById(versionId)
                .orElseThrow(() -> new ResourceNotFoundException("Versão não encontrada"));
        
        List<Comment> comments = commentRepository.findByVersionAndResolvedOrderByCreatedAtDesc(version, resolved);
        return comments.stream().map(this::mapToDTO).collect(Collectors.toList());
    }
    
    public Page<CommentDTO> getCommentsByUser(User user, Pageable pageable) {
        Page<Comment> comments = commentRepository.findByUserOrderByCreatedAtDesc(user, pageable);
        return comments.map(this::mapToDTO);
    }
    
    public List<CommentDTO> getCommentsByPosition(Long versionId, int startPos, int endPos) {
        Version version = versionRepository.findById(versionId)
                .orElseThrow(() -> new ResourceNotFoundException("Versão não encontrada"));
        
        List<Comment> comments = commentRepository
                .findByVersionAndStartPositionGreaterThanEqualAndEndPositionLessThanEqual(
                    version, startPos, endPos);
        return comments.stream().map(this::mapToDTO).collect(Collectors.toList());
    }
    
    @Transactional
    public CommentDTO updateComment(Long id, CommentDTO commentDTO, User currentUser) {
        Comment comment = commentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Comentário não encontrado"));
        
        // Verificar se o usuário é o autor do comentário
        if (!currentUser.getId().equals(comment.getUser().getId())) {
            throw new RuntimeException("Você não tem permissão para editar este comentário");
        }
        
        comment.setContent(commentDTO.getContent());
        comment.setStartPosition(commentDTO.getStartPosition());
        comment.setEndPosition(commentDTO.getEndPosition());
        
        comment = commentRepository.save(comment);
        return mapToDTO(comment);
    }
    
    @Transactional
    public CommentDTO resolveComment(Long id, User currentUser) {
        Comment comment = commentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Comentário não encontrado"));
        
        Document document = comment.getVersion().getDocument();
        
        // Verificar permissões - apenas colaboradores estudantes ou orientadores podem resolver
        boolean allowed = document.getCollaborator(currentUser)
                .map(c -> c.getRole().isStudent() || c.getRole().isAdvisor())
                .orElse(false);
        if (!allowed) {
            throw new RuntimeException("Você não tem permissão para resolver este comentário");
        }
        
        comment.setResolved(true);
        comment.setResolvedAt(LocalDateTime.now());
        comment.setResolvedBy(currentUser);
        
        comment = commentRepository.save(comment);
        
        // Disparar evento de notificação
        notificationEventService.onCommentResolved(comment, currentUser);
        
        return mapToDTO(comment);
    }
    
    @Transactional
    public void deleteComment(Long id, User currentUser) {
        Comment comment = commentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Comentário não encontrado"));
        
        Document document = comment.getVersion().getDocument();
        
        // Verificar permissões - autor do comentário, estudantes ou orientadores podem deletar
        boolean allowed = currentUser.getId().equals(comment.getUser().getId()) ||
                document.getCollaborator(currentUser)
                        .map(c -> c.getRole().isStudent() || c.getRole().isAdvisor())
                        .orElse(false);
        if (!allowed) {
            throw new RuntimeException("Você não tem permissão para deletar este comentário");
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