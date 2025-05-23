package com.tessera.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class LoginResponseDTO {
    
    private Long id;
    private String name;
    private String email;
    private List<String> roles;
    private String token;
}