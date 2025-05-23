package com.tessera.backend.repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import com.tessera.backend.entity.Notification;
import com.tessera.backend.entity.NotificationType;
import com.tessera.backend.entity.User;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {
    
    // Buscar notificações não lidas por usuário
    // CORRIGIDO: usa isRead
    List<Notification> findByUserAndIsReadFalseOrderByCreatedAtDesc(User user);
    
    // Contar notificações não lidas
    // CORRIGIDO: usa isRead
    long countByUserAndIsReadFalse(User user);
    
    long countByUser(User user);
    
    Page<Notification> findByUserOrderByCreatedAtDesc(User user, Pageable pageable);
    
    Optional<Notification> findByIdAndUser(Long id, User user);
    
    List<Notification> findByUserAndTypeOrderByCreatedAtDesc(User user, NotificationType type);
    
    @Query("SELECT n FROM Notification n WHERE n.user = :user AND n.createdAt >= :since ORDER BY n.createdAt DESC")
    List<Notification> findRecentNotifications(@Param("user") User user, @Param("since") LocalDateTime since);
    
    // Marcar múltiplas notificações como lidas
    // CORRIGIDO: usa isRead
    @Modifying
    @Query("UPDATE Notification n SET n.isRead = true, n.readAt = :readAt WHERE n.user = :user AND n.isRead = false")
    int markAllAsReadForUser(@Param("user") User user, @Param("readAt") LocalDateTime readAt);
    
    List<Notification> findByUserAndEntityTypeAndEntityId(User user, String entityType, Long entityId);
    
    @Modifying
    @Query("DELETE FROM Notification n WHERE n.expiresAt IS NOT NULL AND n.expiresAt < :now")
    int deleteExpiredNotifications(@Param("now") LocalDateTime now);
    
    // Buscar notificações para digest de email
    // CORRIGIDO: usa isRead
    @Query("SELECT n FROM Notification n WHERE n.user = :user AND n.isRead = false AND n.createdAt >= :since")
    List<Notification> findUnreadSince(@Param("user") User user, @Param("since") LocalDateTime since);
}