package com.tessera.backend.repository;

import com.tessera.backend.entity.User;
import com.tessera.backend.entity.UserStatus;
import org.springframework.data.domain.Page; // ADICIONAR IMPORT
import org.springframework.data.domain.Pageable; // ADICIONAR IMPORT
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    List<User> findByRolesName(String roleName); // Mantém este se precisar da lista

    long countByRolesName(String roleName); // <-- ADICIONE ESTE MÉTODO PARA CONTAGEM

    // Modifique o método findByStatus para aceitar Pageable e retornar Page<User>
    // List<User> findByStatus(UserStatus status); // Comente ou remova esta linha
    Page<User> findByStatus(UserStatus status, Pageable pageable); // <-- MODIFIQUE/ADICIONE ESTE MÉTODO
}