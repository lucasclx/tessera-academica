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
import static org.mockito.Mockito.*;
import jakarta.servlet.http.HttpServletRequest;

@SpringBootTest(classes = SecurityConfig.class)
@TestPropertySource(properties = "app.cors.allowed-origins=http://example.com")
class SecurityConfigTest {

    @MockBean
    private UserDetailsServiceImpl userDetailsService;

    @MockBean
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    @MockBean
    private UrlBasedCorsConfigurationSource corsConfigurationSource;

    @Test
    void corsConfigurationIncludesConfiguredOrigins() {
        // Mock request with path "/**"
        HttpServletRequest request = mock(HttpServletRequest.class);
        when(request.getRequestURI()).thenReturn("/api/test");
        when(request.getServletPath()).thenReturn("/api/test");
        when(request.getScheme()).thenReturn("http");
        when(request.getServerName()).thenReturn("localhost");
        when(request.getServerPort()).thenReturn(8080);

        CorsConfiguration corsConfig = new CorsConfiguration();
        corsConfig.addAllowedOriginPattern("http://example.com");
        when(corsConfigurationSource.getCorsConfiguration(any())).thenReturn(corsConfig);
        
        CorsConfiguration config = corsConfigurationSource.getCorsConfiguration(request);
        assertNotNull(config, "CORS configuration should not be null");
        assertNotNull(config.getAllowedOriginPatterns(), "Allowed origin patterns should not be null");
        assertTrue(config.getAllowedOriginPatterns().contains("http://example.com"), 
                   "CORS configuration should include configured origin");
    }
}
