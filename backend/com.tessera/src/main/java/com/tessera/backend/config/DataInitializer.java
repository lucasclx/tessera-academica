package com.tessera.backend.config;

import com.tessera.backend.entity.Role;
import com.tessera.backend.entity.User;
import com.tessera.backend.entity.UserStatus;
import com.tessera.backend.repository.RoleRepository;
import com.tessera.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Optional;
import java.util.Set;

@Component
public class DataInitializer implements CommandLineRunner {

    private static final Logger logger = LoggerFactory.getLogger(DataInitializer.class);
    
    @Autowired
    private RoleRepository roleRepository;
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private PasswordEncoder passwordEncoder;
    
    @Override
    public void run(String... args) throws Exception {
        // Inicializa roles se não existirem
        createRoleIfNotFound("ADMIN");
        createRoleIfNotFound("ADVISOR");
        createRoleIfNotFound("STUDENT");
        
        // Cria um admin default se não existir
        if (!userRepository.existsByEmail("admin@tessera.com")) {
            User adminUser = new User();
            adminUser.setName("Administrador");
            adminUser.setEmail("admin@tessera.com");
            adminUser.setPassword(passwordEncoder.encode("admin123"));
            adminUser.setStatus(UserStatus.APPROVED);
            adminUser.setRegistrationDate(LocalDateTime.now());
            adminUser.setApprovalDate(LocalDateTime.now());
            
            Role adminRole = roleRepository.findByName("ADMIN")
                    .orElseThrow(() -> new RuntimeException("Role ADMIN não encontrada"));
            
            Set<Role> roles = new HashSet<>();
            roles.add(adminRole);
            adminUser.setRoles(roles);
            
            userRepository.save(adminUser);

            logger.info("Admin padrão criado: admin@tessera.com / admin123");
        }
    }
    
    private void createRoleIfNotFound(String name) {
        Optional<Role> roleOpt = roleRepository.findByName(name);
        if (roleOpt.isEmpty()) {
            Role role = new Role(name);
            roleRepository.save(role);
            logger.info("Role criada: {}", name);
        }
    }
}