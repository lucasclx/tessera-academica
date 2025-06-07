package com.tessera.backend.config;

import com.tessera.backend.security.JwtAuthenticationFilter;
import com.tessera.backend.security.UserDetailsServiceImpl;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.context.TestPropertySource;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest(classes = SecurityConfig.class)
@TestPropertySource(properties = "app.cors.allowed-origins=http://example.com")
class SecurityConfigTest {

    @MockBean
    private UserDetailsServiceImpl userDetailsService;

    @MockBean
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    @Autowired
    private UrlBasedCorsConfigurationSource corsConfigurationSource;

    @Test
    void corsConfigurationIncludesConfiguredOrigins() {
        CorsConfiguration config = corsConfigurationSource.getCorsConfiguration("/**");
        assertNotNull(config);
        assertTrue(config.getAllowedOriginPatterns().contains("http://example.com"));
    }
}
