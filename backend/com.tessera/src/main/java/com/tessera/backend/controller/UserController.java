package com.tessera.backend.controller;

import com.tessera.backend.dto.AdvisorDTO;
import com.tessera.backend.service.UserService; 
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/users") // Adicionado /api para consistência se o context-path for /api
public class UserController {

    private final UserService userService; 

    @Autowired
    public UserController(UserService userService) { 
        this.userService = userService;
    }

    @GetMapping("/advisors")
    @PreAuthorize("hasRole('STUDENT') or hasRole('ADMIN')")
    public ResponseEntity<List<AdvisorDTO>> getActiveAdvisors() {
        return ResponseEntity.ok(userService.getApprovedAdvisors());
    }
}