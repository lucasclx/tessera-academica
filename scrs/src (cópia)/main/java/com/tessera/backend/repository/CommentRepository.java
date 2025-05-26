package com.tessera.backend.repository;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.tessera.backend.entity.Comment;
import com.tessera.backend.entity.User;
import com.tessera.backend.entity.Version;

@Repository
public interface CommentRepository extends JpaRepository<Comment, Long> {
    
    List<Comment> findByVersionOrderByCreatedAtDesc(Version version);
    
    List<Comment> findByVersionAndResolvedOrderByCreatedAtDesc(Version version, boolean resolved);
    
    Page<Comment> findByUserOrderByCreatedAtDesc(User user, Pageable pageable);
    
    // Encontrar comentários por posição no texto (para comentários contextuais)
    List<Comment> findByVersionAndStartPositionGreaterThanEqualAndEndPositionLessThanEqual(
            Version version, int startPos, int endPos);
}