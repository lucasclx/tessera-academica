package com.tessera.backend.repository;

import com.tessera.backend.entity.User;
import com.tessera.backend.entity.UserStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    List<User> findByRolesName(String roleName);

    long countByRolesName(String roleName);

    Page<User> findByStatus(UserStatus status, Pageable pageable);

    // MÉTODO CORRIGIDO (com underscore em Roles_Name)
    List<User> findByRoles_NameAndStatus(String roleName, UserStatus status);
}