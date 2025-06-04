package com.tessera.backend.service;

import com.tessera.backend.dto.LoginRequestDTO;
import com.tessera.backend.dto.LoginResponseDTO;
import com.tessera.backend.dto.UserRegistrationDTO;
import com.tessera.backend.entity.*;
import com.tessera.backend.exception.EmailAlreadyExistsException;
import com.tessera.backend.repository.RegistrationRequestRepository;
import com.tessera.backend.repository.RoleRepository;
import com.tessera.backend.repository.UserRepository;
import com.tessera.backend.security.JwtTokenProvider;
import com.tessera.backend.security.UserDetailsImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @InjectMocks
    private AuthService service;

    @Mock
    private UserRepository userRepository;
    @Mock
    private RoleRepository roleRepository;
    @Mock
    private RegistrationRequestRepository registrationRequestRepository;
    @Mock
    private PasswordEncoder passwordEncoder;
    @Mock
    private AuthenticationManager authenticationManager;
    @Mock
    private JwtTokenProvider tokenProvider;
    @Mock
    private EmailService emailService;

    private Role studentRole;
    private User admin;

    @BeforeEach
    void setup() {
        studentRole = new Role("STUDENT");
        admin = new User();
        admin.setEmail("admin@test.com");
    }

    @Test
    void testRegisterUserSuccess() {
        UserRegistrationDTO dto = new UserRegistrationDTO("User","user@test.com","pwd","STUDENT","inst","dept","just");

        when(userRepository.existsByEmail(dto.getEmail())).thenReturn(false);
        when(roleRepository.findByName("STUDENT")).thenReturn(Optional.of(studentRole));
        when(passwordEncoder.encode("pwd")).thenReturn("encpwd");
        when(userRepository.save(any(User.class))).thenAnswer(inv->{User u=inv.getArgument(0);u.setId(1L);return u;});
        when(registrationRequestRepository.save(any())).thenAnswer(inv->inv.getArgument(0));
        when(userRepository.findByRolesName("ADMIN")).thenReturn(List.of(admin));

        User user = service.registerUser(dto);

        assertEquals(1L, user.getId());
        verify(emailService).sendNewRegistrationNotification(admin.getEmail(), user);
        verify(registrationRequestRepository).save(any(RegistrationRequest.class));
    }

    @Test
    void testRegisterUserDuplicateEmail() {
        UserRegistrationDTO dto = new UserRegistrationDTO("User","dup@test.com","pwd","STUDENT","i","d","j");
        when(userRepository.existsByEmail(dto.getEmail())).thenReturn(true);

        assertThrows(EmailAlreadyExistsException.class, () -> service.registerUser(dto));
    }

    @Test
    void testAuthenticateUser() {
        LoginRequestDTO dto = new LoginRequestDTO("user@test.com","pwd");
        User user = new User();
        user.setId(5L);
        user.setName("U");
        user.setEmail(dto.getEmail());
        user.setPassword("enc");
        user.setRoles(Set.of(studentRole));
        user.setStatus(UserStatus.APPROVED);

        UserDetailsImpl details = UserDetailsImpl.build(user);
        Authentication auth = new UsernamePasswordAuthenticationToken(details, null, details.getAuthorities());

        when(authenticationManager.authenticate(any())).thenReturn(auth);
        when(tokenProvider.generateToken(auth)).thenReturn("token");

        LoginResponseDTO resp = service.authenticateUser(dto);

        assertEquals("token", resp.getToken());
        assertEquals(user.getId(), resp.getId());
        assertEquals(List.of("ROLE_STUDENT"), resp.getRoles());
    }
}
