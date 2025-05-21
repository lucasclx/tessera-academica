package com.tessera.backend.repository;

import com.tessera.backend.entity.User;
import com.tessera.backend.entity.UserStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    
    Optional<User> findByEmail(String email);
    
    boolean existsByEmail(String email);
    
    List<User> findByRolesName(String roleName);
    
    List<User> findByStatus(UserStatus status);
}