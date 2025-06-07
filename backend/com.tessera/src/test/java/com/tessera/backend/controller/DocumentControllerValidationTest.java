package com.tessera.backend.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.tessera.backend.dto.DocumentDTO;
import com.tessera.backend.entity.User;
import com.tessera.backend.repository.UserRepository;
import com.tessera.backend.service.DocumentService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = DocumentController.class)
@AutoConfigureMockMvc(addFilters = false)
class DocumentControllerValidationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private DocumentService documentService;

    @MockBean
    private UserRepository userRepository;

    @Test
    void createDocumentWithBlankTitleReturnsBadRequest() throws Exception {
        DocumentDTO dto = new DocumentDTO();
        dto.setTitle(" ");
        dto.setDescription("desc");

        User user = new User();
        user.setEmail("user@test.com");
        when(userRepository.findByEmail(any())).thenReturn(Optional.of(user));

        mockMvc.perform(post("/documents")
                        .with(SecurityMockMvcRequestPostProcessors.user("user@test.com"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void createDocumentWithBlankDescriptionReturnsBadRequest() throws Exception {
        DocumentDTO dto = new DocumentDTO();
        dto.setTitle("Title");
        dto.setDescription("\n\t");

        User user = new User();
        user.setEmail("user@test.com");
        when(userRepository.findByEmail(any())).thenReturn(Optional.of(user));

        mockMvc.perform(post("/documents")
                        .with(SecurityMockMvcRequestPostProcessors.user("user@test.com"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isBadRequest());
    }
}
