package com.tessera.backend.service;

import com.tessera.backend.dto.RegistrationApprovalDTO;
import com.tessera.backend.dto.RegistrationRejectionDTO;
import com.tessera.backend.entity.RegistrationRequest;
import com.tessera.backend.entity.RequestStatus;
import com.tessera.backend.entity.User;
import com.tessera.backend.entity.UserStatus;
import com.tessera.backend.exception.ResourceNotFoundException;
import com.tessera.backend.repository.RegistrationRequestRepository;
import com.tessera.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
public class AdminService {
    
    @Autowired
    private RegistrationRequestRepository registrationRequestRepository;
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private EmailService emailService;
    
    public Page<RegistrationRequest> getPendingRegistrations(Pageable pageable) {
        return registrationRequestRepository.findByStatus(RequestStatus.PENDING, pageable);
    }
    
    @Transactional
    public void approveRegistration(Long requestId, User admin, RegistrationApprovalDTO approvalDTO) {
        RegistrationRequest request = registrationRequestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Solicitação de registro não encontrada"));
        
        User user = request.getUser();
        user.setStatus(UserStatus.APPROVED);
        user.setApprovalDate(LocalDateTime.now());
        user.setApprovedBy(admin);
        userRepository.save(user);
        
        request.setStatus(RequestStatus.APPROVED);
        request.setAdminNotes(approvalDTO.getAdminNotes());
        registrationRequestRepository.save(request);
        
        // Notificar usuário
        emailService.sendRegistrationApprovedEmail(user.getEmail(), approvalDTO.getAdminNotes());
    }
    
    @Transactional
    public void rejectRegistration(Long requestId, User admin, RegistrationRejectionDTO rejectionDTO) {
        RegistrationRequest request = registrationRequestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Solicitação de registro não encontrada"));
        
        User user = request.getUser();
        user.setStatus(UserStatus.REJECTED);
        user.setRejectionReason(rejectionDTO.getRejectionReason());
        userRepository.save(user);
        
        request.setStatus(RequestStatus.REJECTED);
        request.setAdminNotes(rejectionDTO.getRejectionReason());
        registrationRequestRepository.save(request);
        
        // Notificar usuário
        emailService.sendRegistrationRejectedEmail(user.getEmail(), rejectionDTO.getRejectionReason());
    }
    
    public RegistrationRequest getRegistrationDetails(Long requestId) {
        return registrationRequestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Solicitação de registro não encontrada"));
    }
}