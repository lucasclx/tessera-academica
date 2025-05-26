package com.tessera.backend.service;

import com.tessera.backend.dto.AdvisorDTO;
import com.tessera.backend.dto.UserSelectionDTO;
import com.tessera.backend.entity.Document;
import com.tessera.backend.entity.User;
import com.tessera.backend.entity.UserStatus;
import com.tessera.backend.repository.DocumentRepository;
import com.tessera.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
public class UserService {

    private final UserRepository userRepository;
    private final DocumentRepository documentRepository;

    @Autowired
    public UserService(UserRepository userRepository, DocumentRepository documentRepository) {
        this.userRepository = userRepository;
        this.documentRepository = documentRepository;
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
    
    /**
     * Busca usuários que podem ser colaboradores (exclui já colaboradores do documento)
     */
    public List<UserSelectionDTO> searchPotentialCollaborators(String search, String role, Long excludeDocumentId) {
        List<User> users;
        
        if (StringUtils.hasText(role)) {
            users = userRepository.findByRolesNameAndStatus(role.toUpperCase(), UserStatus.APPROVED);
        } else {
            // Buscar todos os usuários aprovados (estudantes e orientadores)
            List<User> students = userRepository.findByRolesNameAndStatus("STUDENT", UserStatus.APPROVED);
            List<User> advisors = userRepository.findByRolesNameAndStatus("ADVISOR", UserStatus.APPROVED);
            users = students;
            users.addAll(advisors);
        }
        
        // Filtrar por busca se fornecida
        if (StringUtils.hasText(search)) {
            String searchLower = search.toLowerCase();
            users = users.stream()
                    .filter(user -> user.getName().toLowerCase().contains(searchLower) ||
                                   user.getEmail().toLowerCase().contains(searchLower))
                    .collect(Collectors.toList());
        }
        
        // Excluir colaboradores já existentes do documento
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
                .map(user -> new UserSelectionDTO(user.getId(), user.getName()))
                .collect(Collectors.toList());
    }
    
    /**
     * Busca genérica de usuários com filtros
     */
    public List<UserSelectionDTO> searchUsers(String search, String role, Pageable pageable) {
        Page<User> users;
        
        if (StringUtils.hasText(role)) {
            users = userRepository.findByStatus(UserStatus.APPROVED, pageable);
            // Aplicar filtro de role depois se necessário
        } else {
            users = userRepository.findByStatus(UserStatus.APPROVED, pageable);
        }
        
        return users.stream()
                .filter(user -> {
                    if (StringUtils.hasText(search)) {
                        String searchLower = search.toLowerCase();
                        return user.getName().toLowerCase().contains(searchLower) ||
                               user.getEmail().toLowerCase().contains(searchLower);
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
                .map(user -> new UserSelectionDTO(user.getId(), user.getName()))
                .collect(Collectors.toList());
    }
    
    /**
     * Verifica se um email existe e retorna informações básicas
     */
    public Map<String, Object> checkUserByEmail(String email) {
        Map<String, Object> result = new HashMap<>();
        
        User user = userRepository.findByEmail(email).orElse(null);
        if (user != null) {
            result.put("exists", true);
            result.put("id", user.getId());
            result.put("name", user.getName());
            result.put("status", user.getStatus());
            result.put("roles", user.getRoles().stream()
                    .map(role -> role.getName())
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
        return user != null ? new UserSelectionDTO(user.getId(), user.getName()) : null;
    }
    
    public Page<User> getAllUsers(String search, UserStatus status, Pageable pageable) {
        if (status != null) {
            return userRepository.findByStatus(status, pageable);
        }
        return userRepository.findAll(pageable);
    }
}