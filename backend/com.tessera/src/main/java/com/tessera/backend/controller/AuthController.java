package com.tessera.backend.controller;

import com.tessera.backend.dto.LoginRequestDTO;
import com.tessera.backend.dto.LoginResponseDTO;
import com.tessera.backend.dto.UserRegistrationDTO;
import com.tessera.backend.entity.User;
import com.tessera.backend.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/auth")
public class AuthController {
    
    @Autowired
    private AuthService authService;
    
    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@Valid @RequestBody UserRegistrationDTO registrationDTO) {
        authService.registerUser(registrationDTO);
        return new ResponseEntity<>("Cadastro realizado com sucesso. Aguardando aprovação do administrador.",
                HttpStatus.CREATED);
    }
    
    @PostMapping("/login")
    public ResponseEntity<?> authenticateUser(@Valid @RequestBody LoginRequestDTO loginRequest) {
        LoginResponseDTO loginResponse = authService.authenticateUser(loginRequest);
        return ResponseEntity.ok(loginResponse);
    }
}
