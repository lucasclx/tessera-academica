package com.tessera.backend.service;

import com.tessera.backend.dto.AdvisorDTO;
import com.tessera.backend.entity.User;
import com.tessera.backend.entity.UserStatus;
import com.tessera.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true) // Good practice for read-only services/methods
public class UserService {

    private final UserRepository userRepository;

    @Autowired
    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public List<AdvisorDTO> getApprovedAdvisors() {
        // CORRIGIDO: Chamando o método com o nome correto (sem underscore)
        List<User> advisors = userRepository.findByRolesNameAndStatus("ADVISOR", UserStatus.APPROVED);
        return advisors.stream()
                .map(user -> new AdvisorDTO(user.getId(), user.getName()))
                .collect(Collectors.toList());
    }

    // Outros métodos futuros relacionados a usuários podem ser adicionados aqui
    // Ex: getUserProfile, updateProfile, etc.
    public User findUserByEmail(String email) {
        return userRepository.findByEmail(email).orElse(null); // Exemplo
    }
}