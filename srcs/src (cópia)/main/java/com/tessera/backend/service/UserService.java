package com.tessera.backend.service;

import com.tessera.backend.dto.AdvisorDTO;
import com.tessera.backend.dto.UserSelectionDTO;
import com.tessera.backend.entity.Document;
import com.tessera.backend.entity.DocumentCollaborator; // IMPORTAÇÃO ADICIONADA
import com.tessera.backend.entity.Role; // IMPORTAÇÃO ADICIONADA
import com.tessera.backend.entity.User;
import com.tessera.backend.entity.UserStatus;
import com.tessera.backend.repository.DocumentCollaboratorRepository; // IMPORTAÇÃO ADICIONADA
import com.tessera.backend.repository.DocumentRepository;
import com.tessera.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl; // IMPORTAÇÃO ADICIONADA
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.ArrayList; // IMPORTAÇÃO ADICIONADA
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
public class UserService {

    private final UserRepository userRepository;
    private final DocumentRepository documentRepository;
    private final DocumentCollaboratorRepository collaboratorRepository; // INJEÇÃO ADICIONADA

    @Autowired
    public UserService(UserRepository userRepository, DocumentRepository documentRepository, DocumentCollaboratorRepository collaboratorRepository) {
        this.userRepository = userRepository;
        this.documentRepository = documentRepository;
        this.collaboratorRepository = collaboratorRepository; // INJEÇÃO ADICIONADA
    }

    public List<AdvisorDTO> getApprovedAdvisors() {
        List<User> advisors = userRepository.findByRolesNameAndStatus("ADVISOR", UserStatus.APPROVED);
        return advisors.stream()
                .map(user -> new AdvisorDTO(user.getId(), user.getName()))
                .collect(Collectors.toList());
    }
    
    public List<UserSelectionDTO> getApprovedStudents() {
        List<User> students = userRepository.findByRolesNameAndStatus("STUDENT", UserStatus.APPROVED);
        return students.stream()
                .map(user -> new UserSelectionDTO(user.getId(), user.getName()))
                .collect(Collectors.toList());
    }
    
    public List<UserSelectionDTO> searchPotentialCollaborators(String search, String role, Long excludeDocumentId) {
        List<User> users;
        
        if (StringUtils.hasText(role)) {
            users = userRepository.findByRolesNameAndStatus(role.toUpperCase(), UserStatus.APPROVED);
        } else {
            List<User> students = userRepository.findByRolesNameAndStatus("STUDENT", UserStatus.APPROVED);
            List<User> advisors = userRepository.findByRolesNameAndStatus("ADVISOR", UserStatus.APPROVED);
            users = new ArrayList<>(students); // Garantir mutabilidade
            users.addAll(advisors);
        }
        
        if (StringUtils.hasText(search)) {
            String searchLower = search.toLowerCase();
            users = users.stream()
                    .filter(user -> user.getName().toLowerCase().contains(searchLower) ||
                                   user.getEmail().toLowerCase().contains(searchLower))
                    .collect(Collectors.toList());
        }
        
        if (excludeDocumentId != null) {
            Document document = documentRepository.findById(excludeDocumentId).orElse(null);
            if (document != null) {
                List<Long> existingCollaboratorIds = document.getCollaborators().stream()
                        .filter(c -> c.isActive())
                        .map(c -> c.getUser().getId())
                        .collect(Collectors.toList());
                
                users = users.stream()
                        .filter(user -> !existingCollaboratorIds.contains(user.getId()))
                        .collect(Collectors.toList());
            }
        }
        
        return users.stream()
                .map(user -> new UserSelectionDTO(user.getId(), user.getName(), user.getEmail())) // Adicionado email
                .collect(Collectors.toList());
    }
    
    public List<UserSelectionDTO> searchUsers(String search, String role, Pageable pageable) {
        Page<User> users;
        
        // Implementar lógica de busca mais robusta se necessário, por enquanto usa status aprovado
        users = userRepository.findByStatus(UserStatus.APPROVED, pageable);
        
        return users.stream()
                .filter(user -> {
                    if (StringUtils.hasText(search)) {
                        String searchLower = search.toLowerCase();
                        return (user.getName() != null && user.getName().toLowerCase().contains(searchLower)) ||
                               (user.getEmail() != null && user.getEmail().toLowerCase().contains(searchLower));
                    }
                    return true;
                })
                .filter(user -> {
                    if (StringUtils.hasText(role)) {
                        return user.getRoles().stream()
                                .anyMatch(r -> r.getName().equalsIgnoreCase(role));
                    }
                    return true;
                })
                .map(user -> new UserSelectionDTO(
                    user.getId(), 
                    user.getName(), 
                    user.getEmail(),
                    user.getRoles().stream().findFirst().map(Role::getName).orElse(null),
                    null, // department (não disponível diretamente em User)
                    null, // institution (não disponível diretamente em User)
                    user.getStatus() == UserStatus.APPROVED
                ))
                .collect(Collectors.toList());
    }
    
    public Map<String, Object> checkUserByEmail(String email) {
        Map<String, Object> result = new HashMap<>();
        
        User user = userRepository.findByEmail(email).orElse(null);
        if (user != null) {
            result.put("exists", true);
            result.put("id", user.getId());
            result.put("name", user.getName());
            result.put("status", user.getStatus());
            result.put("roles", user.getRoles().stream()
                    .map(Role::getName)
                    .collect(Collectors.toList()));
        } else {
            result.put("exists", false);
        }
        
        return result;
    }
    
    public User findUserByEmail(String email) {
        return userRepository.findByEmail(email).orElse(null);
    }
    
    public UserSelectionDTO getUserById(Long id) {
        User user = userRepository.findById(id).orElse(null);
        if (user == null) return null;
        return new UserSelectionDTO(
            user.getId(), 
            user.getName(), 
            user.getEmail(),
            user.getRoles().stream().findFirst().map(Role::getName).orElse(null),
            null, 
            null, 
            user.getStatus() == UserStatus.APPROVED
        );
    }
    
    public Page<User> getAllUsers(String search, UserStatus status, Pageable pageable) {
        // Implementar busca por 'search' se necessário
        if (status != null) {
            return userRepository.findByStatus(status, pageable);
        }
        return userRepository.findAll(pageable);
    }

    // NOVO MÉTODO ADICIONADO
    @Transactional(readOnly = true)
    public Page<UserSelectionDTO> getMyAdvisedStudents(User advisor, Pageable pageable, String searchTerm) {
        List<DocumentCollaborator> advisorCollaborations = collaboratorRepository.findByUserAndActiveTrue(advisor).stream()
                .filter(dc -> dc.getRole().isAdvisor())
                .collect(Collectors.toList());

        if (advisorCollaborations.isEmpty()) {
            return Page.empty(pageable);
        }

        List<Long> documentIdsWhereAdvisor = advisorCollaborations.stream()
                .map(dc -> dc.getDocument().getId())
                .distinct()
                .collect(Collectors.toList());

        List<User> allStudentsForAdvisor = new ArrayList<>();
        if (!documentIdsWhereAdvisor.isEmpty()) {
            // Supondo que você adicionou `findAllByDocumentIdInAndActiveTrue` ao DocumentCollaboratorRepository
            List<DocumentCollaborator> studentCollaborationsInAdvisedDocs = collaboratorRepository.findAllByDocumentIdInAndActiveTrue(documentIdsWhereAdvisor).stream()
                .filter(dc -> dc.getRole().isStudent() && dc.getUser() != null) // Garante que o usuário não é nulo
                .collect(Collectors.toList());
            
            allStudentsForAdvisor = studentCollaborationsInAdvisedDocs.stream()
                .map(DocumentCollaborator::getUser)
                .distinct() 
                .collect(Collectors.toList());
        }

        List<User> filteredStudents;
        if (StringUtils.hasText(searchTerm)) {
            String lowerSearchTerm = searchTerm.toLowerCase();
            filteredStudents = allStudentsForAdvisor.stream()
                    .filter(student -> (student.getName() != null && student.getName().toLowerCase().contains(lowerSearchTerm)) ||
                                       (student.getEmail() != null && student.getEmail().toLowerCase().contains(lowerSearchTerm)))
                    .collect(Collectors.toList());
        } else {
            filteredStudents = allStudentsForAdvisor;
        }

        List<UserSelectionDTO> studentDTOs = filteredStudents.stream()
            .map(user -> new UserSelectionDTO(
                    user.getId(),
                    user.getName(),
                    user.getEmail(),
                    user.getRoles().stream().findFirst().map(Role::getName).orElse("STUDENT"),
                    null, // department - Não disponível em User, viria de RegistrationRequest
                    null, // institution - Não disponível em User, viria de RegistrationRequest
                    user.getStatus() == UserStatus.APPROVED
            ))
            .collect(Collectors.toList());

        int start = (int) pageable.getOffset();
        int end = Math.min((start + pageable.getPageSize()), studentDTOs.size());
        List<UserSelectionDTO> pageContent = studentDTOs.isEmpty() ? new ArrayList<>() : studentDTOs.subList(start, end);

        return new PageImpl<>(pageContent, pageable, studentDTOs.size());
    }
}