package com.tessera.backend.controller;

import com.tessera.backend.dto.UserSelectionDTO;
import com.tessera.backend.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
@Tag(name = "Usuários", description = "Operações relacionadas a usuários e busca de colaboradores")
public class UserSearchController {
    
    @Autowired
    private UserService userService;
    
    @GetMapping("/search/collaborators")
    @Operation(summary = "Buscar colaboradores potenciais", 
               description = "Busca usuários que podem ser adicionados como colaboradores")
    public ResponseEntity<List<UserSelectionDTO>> searchPotentialCollaborators(
            @Parameter(description = "Termo de busca (nome ou email)")
            @RequestParam(required = false) String search,
            @Parameter(description = "Filtro por papel (STUDENT, ADVISOR)")
            @RequestParam(required = false) String role,
            @Parameter(description = "ID do documento para excluir colaboradores existentes")
            @RequestParam(required = false) Long excludeDocument) {
        
        List<UserSelectionDTO> users = userService.searchPotentialCollaborators(search, role, excludeDocument);
        return ResponseEntity.ok(users);
    }
    
    @GetMapping("/search")
    @Operation(summary = "Buscar usuários", description = "Busca geral de usuários com filtros")
    public ResponseEntity<List<UserSelectionDTO>> searchUsers(
            @Parameter(description = "Termo de busca")
            @RequestParam(required = false) String search,
            @Parameter(description = "Filtro por papel")
            @RequestParam(required = false) String role,
            Pageable pageable) {
        
        List<UserSelectionDTO> users = userService.searchUsers(search, role, pageable);
        return ResponseEntity.ok(users);
    }
    
    @GetMapping("/check-email")
    @Operation(summary = "Verificar email", description = "Verifica se um email existe e retorna informações básicas")
    public ResponseEntity<Map<String, Object>> checkUserByEmail(
            @Parameter(description = "Email a ser verificado")
            @RequestParam String email) {
        
        Map<String, Object> result = userService.checkUserByEmail(email);
        return ResponseEntity.ok(result);
    }
    
    @GetMapping("/{id}/basic")
    @Operation(summary = "Obter informações básicas", description = "Retorna informações básicas de um usuário")
    public ResponseEntity<UserSelectionDTO> getUserBasicInfo(
            @Parameter(description = "ID do usuário")
            @PathVariable Long id) {
        
        UserSelectionDTO user = userService.getUserById(id);
        if (user != null) {
            return ResponseEntity.ok(user);
        }
        return ResponseEntity.notFound().build();
    }
}