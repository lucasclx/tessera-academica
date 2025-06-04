package com.tessera.backend.service;

import com.tessera.backend.dto.LoginRequestDTO;
import com.tessera.backend.dto.LoginResponseDTO;
import com.tessera.backend.dto.UserRegistrationDTO;
import com.tessera.backend.entity.RegistrationRequest;
import com.tessera.backend.entity.Role;
import com.tessera.backend.entity.User;
import com.tessera.backend.entity.UserStatus;
import com.tessera.backend.exception.EmailAlreadyExistsException;
import com.tessera.backend.exception.RoleNotFoundException;
import com.tessera.backend.repository.RegistrationRequestRepository;
import com.tessera.backend.repository.RoleRepository;
import com.tessera.backend.repository.UserRepository;
import com.tessera.backend.security.JwtTokenProvider;
import com.tessera.backend.security.UserDetailsImpl;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.cache.annotation.CacheEvict;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class AuthService {
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private RoleRepository roleRepository;
    
    @Autowired
    private RegistrationRequestRepository registrationRequestRepository;
    
    @Autowired
    private PasswordEncoder passwordEncoder;
    
    @Autowired
    private AuthenticationManager authenticationManager;
    
    @Autowired
    private JwtTokenProvider tokenProvider;
    
    @Autowired
    private EmailService emailService;
    
    @Transactional
    @CacheEvict(value = "approvedAdvisors", allEntries = true)
    public User registerUser(UserRegistrationDTO registrationDTO) {
        // Verifica se email já existe
        if (userRepository.existsByEmail(registrationDTO.getEmail())) {
            throw new EmailAlreadyExistsException("Email já cadastrado");
        }
        
        // Cria novo usuário
        User user = new User();
        user.setName(registrationDTO.getName());
        user.setEmail(registrationDTO.getEmail());
        user.setPassword(passwordEncoder.encode(registrationDTO.getPassword()));
        user.setStatus(UserStatus.PENDING);
        user.setRegistrationDate(LocalDateTime.now());
        
        // Atribui role
        Role role = roleRepository.findByName(registrationDTO.getRole())
                .orElseThrow(() -> new RoleNotFoundException("Role não encontrada: " + registrationDTO.getRole()));
        
        Set<Role> roles = new HashSet<>();
        roles.add(role);
        user.setRoles(roles);
        
        // Salva usuário
        user = userRepository.save(user);
        
        // Cria requisição de registro
        RegistrationRequest request = new RegistrationRequest();
        request.setUser(user);
        request.setInstitution(registrationDTO.getInstitution());
        request.setDepartment(registrationDTO.getDepartment());
        request.setJustification(registrationDTO.getJustification());
        registrationRequestRepository.save(request);
        
        // Notifica administradores
        notifyAdminsAboutNewRegistration(user);
        
        return user;
    }
    
    public LoginResponseDTO authenticateUser(LoginRequestDTO loginRequest) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        loginRequest.getEmail(),
                        loginRequest.getPassword()
                )
        );
        
        SecurityContextHolder.getContext().setAuthentication(authentication);
        String jwt = tokenProvider.generateToken(authentication);
        
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        List<String> roles = userDetails.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .collect(Collectors.toList());
        
        return new LoginResponseDTO(
                userDetails.getId(),
                userDetails.getName(),
                userDetails.getUsername(),
                roles,
                jwt
        );
    }
    
    private void notifyAdminsAboutNewRegistration(User newUser) {
        List<User> admins = userRepository.findByRolesName("ADMIN");
        for (User admin : admins) {
            emailService.sendNewRegistrationNotification(admin.getEmail(), newUser);
        }
    }
}