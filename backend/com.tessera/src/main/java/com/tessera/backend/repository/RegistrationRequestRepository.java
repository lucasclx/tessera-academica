package com.tessera.backend.repository;

import com.tessera.backend.entity.RegistrationRequest;
import com.tessera.backend.entity.RequestStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface RegistrationRequestRepository extends JpaRepository<RegistrationRequest, Long> {
    
    Page<RegistrationRequest> findByStatus(RequestStatus status, Pageable pageable);
    
    Optional<RegistrationRequest> findByUserId(Long userId);
}