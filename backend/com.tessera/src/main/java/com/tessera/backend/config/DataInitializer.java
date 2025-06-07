package com.tessera.backend.config;

import com.tessera.backend.entity.Role;
import com.tessera.backend.entity.User;
import com.tessera.backend.entity.UserStatus;
import com.tessera.backend.repository.RoleRepository;
import com.tessera.backend.repository.UserRepository;
import com.tessera.backend.exception.RoleNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Base64;
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

    @Value("${app.default.admin.password:}")
    private String defaultAdminPassword;
    
    @Override
    public void run(String... args) throws Exception {
        // Inicializa roles se não existirem
        createRoleIfNotFound("ADMIN");
        createRoleIfNotFound("ADVISOR");
        createRoleIfNotFound("STUDENT");
        
        // Cria um admin default se não existir
        if (!userRepository.existsByEmail("admin@tessera.com")) {
            User adminUser = new User();
            adminUser.setName("Administrador Padrão");
            adminUser.setEmail("admin@tessera.com");
            
            String password;
            if (defaultAdminPassword != null && !defaultAdminPassword.isEmpty()) {
                password = defaultAdminPassword;
                logger.warn("Usando senha de administrador padrão definida em 'app.default.admin.password'.");
            } else {
                password = generateRandomPassword();
                logger.warn("==========================================================================================");
                logger.warn("ATENÇÃO: Senha de administrador padrão não foi definida (APP_DEFAULT_ADMIN_PASSWORD).");
                logger.warn("Uma senha aleatória e segura foi gerada. Anote-a para o primeiro login:");
                logger.warn("Usuário: admin@tessera.com");
                logger.warn("Senha: {}", password);
                logger.warn("É altamente recomendável alterar esta senha após o primeiro login.");
                logger.warn("==========================================================================================");
            }

            adminUser.setPassword(passwordEncoder.encode(password));
            adminUser.setStatus(UserStatus.APPROVED);
            adminUser.setRegistrationDate(LocalDateTime.now());
            adminUser.setApprovalDate(LocalDateTime.now());
            
            Role adminRole = roleRepository.findByName("ADMIN")
                    .orElseThrow(() -> new RoleNotFoundException("Role ADMIN não encontrada"));
            
            Set<Role> roles = new HashSet<>();
            roles.add(adminRole);
            adminUser.setRoles(roles);
            
            userRepository.save(adminUser);

            logger.info("Usuário administrador padrão criado com sucesso para: admin@tessera.com");
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

    private String generateRandomPassword() {
        SecureRandom random = new SecureRandom();
        byte[] bytes = new byte[12]; // Gera 16 caracteres Base64
        random.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }
}