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
    
    // ADICIONANDO: Injeção do serviço de eventos de notificação
    @Autowired
    private NotificationEventService notificationEventService;

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

        emailService.sendRegistrationApprovedEmail(user.getEmail(), approvalDTO.getAdminNotes());
        
        // ADICIONANDO: Disparar evento de notificação
        notificationEventService.onUserApproved(user, admin);
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

        emailService.sendRegistrationRejectedEmail(user.getEmail(), rejectionDTO.getRejectionReason());
        
        // ADICIONANDO: Disparar evento de notificação
        notificationEventService.onUserRejected(user, admin, rejectionDTO.getRejectionReason());
    }

    @Transactional
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
            
            // ADICIONANDO: Disparar evento de notificação se status mudou
            if (oldStatus != UserStatus.APPROVED) {
                notificationEventService.onUserApproved(user, admin);
            }
        } else if (statusUpdateDTO.getStatus() == UserStatus.REJECTED) {
            user.setRejectionReason(statusUpdateDTO.getReason());
            emailService.sendRegistrationRejectedEmail(user.getEmail(), statusUpdateDTO.getReason());
            
            // ADICIONANDO: Disparar evento de notificação se status mudou
            if (oldStatus != UserStatus.REJECTED) {
                notificationEventService.onUserRejected(user, admin, statusUpdateDTO.getReason());
            }
        }
        
        userRepository.save(user);
    }
    
    // Resto dos métodos permanecem inalterados...
    // (getPendingRegistrations, getRegistrationDetails, etc.)
} de eventos de notificação
    @Autowired
    private NotificationEventService notificationEventService;
    
    @Transactional
    public DocumentDTO createDocument(DocumentDTO documentDTO, User currentUser) {
        // Verificar se o estudante e o orientador existem
        User student = userRepository.findById(documentDTO.getStudentId())
                .orElseThrow(() -> new ResourceNotFoundException("Estudante não encontrado"));
        
        User advisor = userRepository.findById(documentDTO.getAdvisorId())
                .orElseThrow(() -> new ResourceNotFoundException("Orientador não encontrado"));
        
        // Verificar se o usuário atual é o estudante ou tem permissão administrativa
        if (!currentUser.getId().equals(student.getId()) && 
            !currentUser.getRoles().stream().anyMatch(r -> r.getName().equals("ADMIN"))) {
            throw new RuntimeException("Você não tem permissão para criar documentos para este estudante");
        }
        
        Document document = new Document();
        document.setTitle(documentDTO.getTitle());
        document.setDescription(documentDTO.getDescription());
        document.setStudent(student);
        document.setAdvisor(advisor);
        document.setStatus(DocumentStatus.DRAFT);
        
        document = documentRepository.save(document);
        
        // ADICIONANDO: Disparar evento de notificação
        notificationEventService.onDocumentCreated(document, currentUser);
        
        return mapToDTO(document);
    }
    
    @Transactional
    public DocumentDTO changeStatus(Long id, DocumentStatus newStatus, User currentUser, String reason) {
        Document document = documentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Documento não encontrado"));
        
        // Armazenar status anterior para comparação
        DocumentStatus oldStatus = document.getStatus();
        
        // Verificar permissões baseadas no fluxo de trabalho
        if (newStatus == DocumentStatus.SUBMITTED) {
            // Somente o aluno pode submeter
            if (!currentUser.getId().equals(document.getStudent().getId())) {
                throw new RuntimeException("Apenas o estudante pode submeter o documento");
            }
            document.setSubmittedAt(LocalDateTime.now());
            
            // ADICIONANDO: Disparar evento de notificação
            notificationEventService.onDocumentSubmitted(document, currentUser);
            
        } else if (newStatus == DocumentStatus.REVISION || newStatus == DocumentStatus.APPROVED) {
            // Somente o orientador pode aprovar ou solicitar revisão
            if (!currentUser.getId().equals(document.getAdvisor().getId())) {
                throw new RuntimeException("Apenas o orientador pode aprovar ou solicitar revisão");
            }
            
            if (newStatus == DocumentStatus.APPROVED) {
                document.setApprovedAt(LocalDateTime.now());
            }
        } else if (newStatus == DocumentStatus.FINALIZED) {
            // Verificar se foi aprovado antes de finalizar
            if (document.getStatus() != DocumentStatus.APPROVED) {
                throw new RuntimeException("O documento deve ser aprovado antes de ser finalizado");
            }
            
            // Ambos podem finalizar
            if (!currentUser.getId().equals(document.getStudent().getId()) && 
                !currentUser.getId().equals(document.getAdvisor().getId())) {
                throw new RuntimeException("Apenas o estudante ou orientador podem finalizar");
            }
        }
        
        // Atualizar status
        document.setStatus(newStatus);
        
        // Se rejeitar, salvar motivo
        if (reason != null && !reason.trim().isEmpty()) {
            document.setRejectionReason(reason);
            document.setRejectedAt(LocalDateTime.now());
        }
        
        document = documentRepository.save(document);
        
        // ADICIONANDO: Disparar evento de notificação se o status mudou
        if (oldStatus != newStatus) {
            notificationEventService.onDocumentStatusChanged(document, oldStatus, currentUser);
        }
        
        return mapToDTO(document);
    }
    
    // Resto dos métodos permanecem inalterados...
    // (getDocument, getDocumentsByStudent, etc.)
    
    private DocumentDTO mapToDTO(Document document) {
        DocumentDTO dto = new DocumentDTO();
        dto.setId(document.getId());
        dto.setTitle(document.getTitle());
        dto.setDescription(document.getDescription());
        dto.setStatus(document.getStatus());
        dto.setStudentId(document.getStudent().getId());
        dto.setAdvisorId(document.getAdvisor().getId());
        dto.setStudentName(document.getStudent().getName());
        dto.setAdvisorName(document.getAdvisor().getName());
        dto.setCreatedAt(document.getCreatedAt());
        dto.setUpdatedAt(document.getUpdatedAt());
        
        return dto;
    }
}