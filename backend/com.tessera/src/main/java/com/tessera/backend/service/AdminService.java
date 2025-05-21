package com.tessera.backend.service;

import com.tessera.backend.dto.DashboardStatsDTO; // Adicionar import
import com.tessera.backend.dto.RegistrationApprovalDTO;
import com.tessera.backend.dto.RegistrationRejectionDTO;
import com.tessera.backend.dto.UserStatusUpdateDTO; // Adicionar import
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
import org.springframework.util.StringUtils; // Adicionar import para StringUtils

import java.time.LocalDateTime;
import java.util.List; // Adicionar import

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
        user.setRejectionReason(rejectionDTO.getRejectionReason()); // Salva a razão da rejeição no usuário
        userRepository.save(user);

        request.setStatus(RequestStatus.REJECTED);
        request.setAdminNotes(rejectionDTO.getRejectionReason()); // Salva a razão também nas notas do admin na requisição
        registrationRequestRepository.save(request);

        // Notificar usuário
        emailService.sendRegistrationRejectedEmail(user.getEmail(), rejectionDTO.getRejectionReason());
    }

    public RegistrationRequest getRegistrationDetails(Long requestId) {
        return registrationRequestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Solicitação de registro não encontrada"));
    }

    // MÉTODO ADICIONADO
    public DashboardStatsDTO getDashboardStats() {
        // Implementação de exemplo - você precisará buscar os dados reais
        long totalUsers = userRepository.count();
        long totalStudents = userRepository.countByRolesName("STUDENT"); // Assumindo que você tem um método assim ou lógica similar
        long totalAdvisors = userRepository.countByRolesName("ADVISOR"); // Assumindo que você tem um método assim ou lógica similar
        long pendingRegistrations = registrationRequestRepository.countByStatus(RequestStatus.PENDING); // Assumindo que você tem um método assim

        return new DashboardStatsDTO(
            (int) totalUsers,
            (int) totalStudents,
            (int) totalAdvisors,
            (int) pendingRegistrations
        );
    }

    // MÉTODO ADICIONADO
    public Page<User> getUsers(Pageable pageable, String status) {
        if (StringUtils.hasText(status)) {
            try {
                UserStatus userStatus = UserStatus.valueOf(status.toUpperCase());
                return userRepository.findByStatus(userStatus, pageable); // Você pode precisar criar este método no UserRepository
            } catch (IllegalArgumentException e) {
                // Tratar status inválido, talvez lançar uma exceção ou retornar lista vazia/todos
                // Por enquanto, retornando todos se o status for inválido
                return userRepository.findAll(pageable);
            }
        }
        return userRepository.findAll(pageable);
    }

    // MÉTODO ADICIONADO
    @Transactional
    public void updateUserStatus(Long userId, User admin, UserStatusUpdateDTO statusUpdateDTO) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado com ID: " + userId));

        user.setStatus(statusUpdateDTO.getStatus());
        if (statusUpdateDTO.getStatus() == UserStatus.APPROVED) {
            user.setApprovalDate(LocalDateTime.now());
            user.setApprovedBy(admin);
            user.setRejectionReason(null); // Limpar razão de rejeição se estiver aprovando
            emailService.sendRegistrationApprovedEmail(user.getEmail(), statusUpdateDTO.getReason()); // Usar 'reason' como 'adminNotes'
        } else if (statusUpdateDTO.getStatus() == UserStatus.REJECTED) {
            user.setRejectionReason(statusUpdateDTO.getReason());
            emailService.sendRegistrationRejectedEmail(user.getEmail(), statusUpdateDTO.getReason());
        }
        // Para PENDING, geralmente não se altera status manualmente para PENDING aqui,
        // mas se houver essa lógica, adicione-a.

        userRepository.save(user);
    }
}