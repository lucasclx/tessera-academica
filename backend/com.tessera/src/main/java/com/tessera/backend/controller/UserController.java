package com.tessera.backend.controller;

import com.tessera.backend.dto.AdvisorDTO;
import com.tessera.backend.dto.UserSelectionDTO;
import com.tessera.backend.entity.User;
import com.tessera.backend.entity.UserStatus;
import com.tessera.backend.service.UserService; 
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication; // <-- ADICIONADO ESTE IMPORT
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/users")
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

    @GetMapping("/students")
    @PreAuthorize("hasRole('ADVISOR') or hasRole('ADMIN')")
    public ResponseEntity<List<UserSelectionDTO>> getActiveStudents() {
        return ResponseEntity.ok(userService.getApprovedStudents());
    }

    @GetMapping("/search")
    @PreAuthorize("hasRole('STUDENT') or hasRole('ADVISOR') or hasRole('ADMIN')")
    public ResponseEntity<List<UserSelectionDTO>> searchUsers(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String role,
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(userService.searchUsers(search, role, pageable));
    }

    @GetMapping("/check-email")
    @PreAuthorize("hasRole('STUDENT') or hasRole('ADVISOR') or hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> checkUserByEmail(@RequestParam String email) {
        return ResponseEntity.ok(userService.checkUserByEmail(email));
    }

    @GetMapping("/collaborators/search")
    @PreAuthorize("hasRole('STUDENT') or hasRole('ADVISOR') or hasRole('ADMIN')")
    public ResponseEntity<List<UserSelectionDTO>> searchPotentialCollaborators(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String role,
            @RequestParam(required = false) Long excludeDocumentId) {
        return ResponseEntity.ok(userService.searchPotentialCollaborators(search, role, excludeDocumentId));
    }

    @GetMapping("/profile")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<User> getCurrentUserProfile(Authentication authentication) {
        User user = userService.findUserByEmail(authentication.getName());
        if (user == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(user);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or @authorizationService.canViewUser(authentication.principal, #id)")
    public ResponseEntity<UserSelectionDTO> getUserById(@PathVariable Long id) {
        UserSelectionDTO user = userService.getUserById(id);
        if (user == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(user);
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Page<User>> getAllUsers(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) UserStatus status,
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(userService.getAllUsers(search, status, pageable));
    }
}