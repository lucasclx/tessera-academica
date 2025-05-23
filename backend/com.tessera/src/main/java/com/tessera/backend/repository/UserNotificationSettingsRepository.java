package com.tessera.backend.repository;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import com.tessera.backend.entity.User;
import com.tessera.backend.entity.UserNotificationSettings;

@Repository
public interface UserNotificationSettingsRepository extends JpaRepository<UserNotificationSettings, Long> {
    
    Optional<UserNotificationSettings> findByUser(User user);
    
    void deleteByUser(User user);
}
