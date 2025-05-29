// Arquivo: scrs/src/main/java/com/tessera/backend/entity/Role.java
package com.tessera.backend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.Set; // <-- IMPORTAÇÃO ADICIONADA

@Entity
@Table(name = "roles")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Role {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(unique = true, nullable = false)
    private String name;
    
    // Construtor para facilitar a criação (opcional, Lombok @AllArgsConstructor já cobre)
    public Role(String name) {
        this.name = name;
    }
    
    // Relacionamento com User (opcional, depende do design, mas geralmente não é necessário aqui
    // se User já tem o @ManyToMany)
    // @ManyToMany(mappedBy = "roles")
    // private Set<User> users; 
}