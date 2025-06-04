package com.tessera.backend.service;

import com.tessera.backend.dto.DashboardStatsDTO;
import com.tessera.backend.dto.RegistrationApprovalDTO;
import com.tessera.backend.dto.RegistrationRejectionDTO;
import com.tessera.backend.dto.UserStatusUpdateDTO;
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
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.util.StringUtils;
import java.time.LocalDateTime;

@Service
public class AdminService {

    @Autowired
    private RegistrationRequestRepository registrationRequestRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private EmailService emailService;
    
    @Autowired
    private NotificationEventService notificationEventService;

    @Transactional
    @CacheEvict(value = "approvedAdvisors", allEntries = true)
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

        emailService.sendRegistrationApprovedEmail(user.getEmail(), approvalDTO.getAdminNotes());
        
        notificationEventService.onUserApproved(user, admin);
    }

    @Transactional
    @CacheEvict(value = "approvedAdvisors", allEntries = true)
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

        emailService.sendRegistrationRejectedEmail(user.getEmail(), rejectionDTO.getRejectionReason());
        
        notificationEventService.onUserRejected(user, admin, rejectionDTO.getRejectionReason());
    }

    @Transactional
    @CacheEvict(value = "approvedAdvisors", allEntries = true)
    public void updateUserStatus(Long userId, User admin, UserStatusUpdateDTO statusUpdateDTO) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado com ID: " + userId));

        UserStatus oldStatus = user.getStatus();
        user.setStatus(statusUpdateDTO.getStatus());
        
        if (statusUpdateDTO.getStatus() == UserStatus.APPROVED) {
            user.setApprovalDate(LocalDateTime.now());
            user.setApprovedBy(admin);
            user.setRejectionReason(null);
            emailService.sendRegistrationApprovedEmail(user.getEmail(), statusUpdateDTO.getReason());
            
            if (oldStatus != UserStatus.APPROVED) {
                notificationEventService.onUserApproved(user, admin);
            }
        } else if (statusUpdateDTO.getStatus() == UserStatus.REJECTED) {
            user.setRejectionReason(statusUpdateDTO.getReason());
            emailService.sendRegistrationRejectedEmail(user.getEmail(), statusUpdateDTO.getReason());
            
            if (oldStatus != UserStatus.REJECTED) {
                notificationEventService.onUserRejected(user, admin, statusUpdateDTO.getReason());
            }
        }
        
        userRepository.save(user);
    }

    public Page<RegistrationRequest> getPendingRegistrations(Pageable pageable) {
        return registrationRequestRepository.findByStatus(RequestStatus.PENDING, pageable);
    }

    public RegistrationRequest getRegistrationDetails(Long id) {
        return registrationRequestRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Solicitação não encontrada com ID: " + id));
    }

    public DashboardStatsDTO getDashboardStats() {
        long totalUsers = userRepository.count();
        long totalStudents = userRepository.countByRolesName("STUDENT");
        long totalAdvisors = userRepository.countByRolesName("ADVISOR");
        long pendingRegistrations = registrationRequestRepository.countByStatus(RequestStatus.PENDING);
        
        return new DashboardStatsDTO(
            (int) totalUsers,
            (int) totalStudents,
            (int) totalAdvisors,
            (int) pendingRegistrations
        );
    }

    public Page<User> getUsers(Pageable pageable, String status) {
        if (StringUtils.hasText(status)) {
            UserStatus userStatus = UserStatus.valueOf(status.toUpperCase());
            return userRepository.findByStatus(userStatus, pageable);
        }
        return userRepository.findAll(pageable);
    }
}