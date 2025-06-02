// Arquivo: scrs/src (cópia)/main/java/com/tessera/backend/controller/UserController.java
package com.tessera.backend.controller;

import com.tessera.backend.dto.AdvisorDTO;
import com.tessera.backend.dto.PasswordChangeDTO; // IMPORTAÇÃO ADICIONADA
import com.tessera.backend.dto.UserSelectionDTO;
import com.tessera.backend.entity.User;
import com.tessera.backend.entity.UserStatus;
import com.tessera.backend.repository.UserRepository;
import com.tessera.backend.service.UserService;
import jakarta.validation.Valid; // IMPORTAÇÃO ADICIONADA
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/users")
public class UserController {

    private final UserService userService;
    private final UserRepository userRepository;

    @Autowired
    public UserController(UserService userService, UserRepository userRepository) {
        this.userService = userService;
        this.userRepository = userRepository;
    }

    @GetMapping("/advisors")
    @PreAuthorize("hasRole('STUDENT') or hasRole('ADMIN') or hasRole('ADVISOR')")
    public ResponseEntity<List<AdvisorDTO>> getActiveAdvisors() {
        return ResponseEntity.ok(userService.getApprovedAdvisors());
    }

    @GetMapping("/students")
    @PreAuthorize("hasRole('ADVISOR') or hasRole('ADMIN')")
    public ResponseEntity<List<UserSelectionDTO>> getActiveStudents() {
        return ResponseEntity.ok(userService.getApprovedStudents());
    }

    @GetMapping("/search-generic")
    @PreAuthorize("hasRole('STUDENT') or hasRole('ADVISOR') or hasRole('ADMIN')")
    public ResponseEntity<List<UserSelectionDTO>> searchUsersGeneric(
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

    @GetMapping("/search/collaborators")
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
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UserSelectionDTO> getUserById(@PathVariable Long id) {
        UserSelectionDTO user = userService.getUserById(id);
        if (user == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(user);
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Page<User>> getAllUsersController(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) UserStatus status,
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(userService.getAllUsers(search, status, pageable));
    }

    @GetMapping("/advisor/my-students")
    @PreAuthorize("hasRole('ADVISOR')")
    public ResponseEntity<Page<UserSelectionDTO>> getMyAdvisedStudents(
            Authentication authentication,
            @RequestParam(required = false) String search,
            Pageable pageable) {
        User currentUser = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new RuntimeException("Usuário não autenticado ou não encontrado"));
        Page<UserSelectionDTO> students = userService.getMyAdvisedStudents(currentUser, pageable, search);
        return ResponseEntity.ok(students);
    }

    // NOVO ENDPOINT ADICIONADO PARA ALTERAÇÃO DE SENHA
    @PostMapping("/profile/change-password")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> changePassword(
            Authentication authentication,
            @Valid @RequestBody PasswordChangeDTO passwordChangeDTO) {
        User currentUser = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new RuntimeException("Usuário não autenticado ou não encontrado"));
        
        userService.changePassword(currentUser, passwordChangeDTO);
        return ResponseEntity.ok().body("Senha alterada com sucesso.");
    }
}