package com.tessera.backend.controller;

import com.tessera.backend.dto.RegistrationApprovalDTO;
import com.tessera.backend.dto.RegistrationRejectionDTO;
import com.tessera.backend.entity.RegistrationRequest;
import com.tessera.backend.entity.User;
import com.tessera.backend.repository.UserRepository;
import com.tessera.backend.service.AdminService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {
    
    @Autowired
    private AdminService adminService;
    
    @Autowired
    private UserRepository userRepository;
    
    @GetMapping("/registrations")
    public ResponseEntity<Page<RegistrationRequest>> getPendingRegistrations(Pageable pageable) {
        return ResponseEntity.ok(adminService.getPendingRegistrations(pageable));
    }
    
    @GetMapping("/registrations/{id}")
    public ResponseEntity<RegistrationRequest> getRegistrationDetails(@PathVariable Long id) {
        return ResponseEntity.ok(adminService.getRegistrationDetails(id));
    }
    
    @PutMapping("/registrations/{id}/approve")
    public ResponseEntity<?> approveRegistration(
            @PathVariable Long id,
            @Valid @RequestBody RegistrationApprovalDTO approvalDTO,
            Authentication authentication) {
        
        User admin = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado"));
        
        adminService.approveRegistration(id, admin, approvalDTO);
        return ResponseEntity.ok().body("Solicitação aprovada com sucesso");
    }
    
    @PutMapping("/registrations/{id}/reject")
    public ResponseEntity<?> rejectRegistration(
            @PathVariable Long id,
            @Valid @RequestBody RegistrationRejectionDTO rejectionDTO,
            Authentication authentication) {
        
        User admin = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado"));
        
        adminService.rejectRegistration(id, admin, rejectionDTO);
        return ResponseEntity.ok().body("Solicitação rejeitada");
    }
}