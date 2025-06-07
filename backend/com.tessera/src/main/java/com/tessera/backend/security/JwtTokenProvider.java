package com.tessera.backend.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.MalformedJwtException;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.UnsupportedJwtException;
import io.jsonwebtoken.security.Keys;
import io.jsonwebtoken.security.SignatureException;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.stereotype.Component;

import jakarta.annotation.PostConstruct;
import java.security.Key;
import java.util.Arrays;
import java.util.Collection;
import java.util.Date;
import java.util.stream.Collectors;

@Component
public class JwtTokenProvider {

    private static final Logger logger = LoggerFactory.getLogger(JwtTokenProvider.class);

    // Corrigido para corresponder ao application.properties
    @Value("${app.jwt.secret}")
    private String jwtSecret;

    @Value("${app.jwt.expiration}")
    private int jwtExpirationInMs;

    private Key signingKey;

    @PostConstruct
    public void init() {
        // Validação da chave secreta na inicialização
        if (jwtSecret == null || jwtSecret.length() < 32) {
            logger.error("A chave secreta JWT ('app.jwt.secret') deve ter pelo menos 256 bits (32 caracteres). A aplicação não é segura.");
            // Considerar lançar uma exceção aqui para impedir a inicialização em produção
            // throw new IllegalStateException("JWT Secret is not secure.");
        }
        byte[] keyBytes = jwtSecret.getBytes();
        this.signingKey = Keys.hmacShaKeyFor(keyBytes);
    }

    private Key getSigningKey() {
        return this.signingKey;
    }

    public String generateToken(Authentication authentication) {
        UserDetailsImpl userPrincipal = (UserDetailsImpl) authentication.getPrincipal();
        
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + jwtExpirationInMs);
        
        String authorities = userPrincipal.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .collect(Collectors.joining(","));
        
        logger.debug("Gerando token para usuário: {}, ID: {}, Nome: {}", userPrincipal.getUsername(), userPrincipal.getId(), userPrincipal.getName());

        return Jwts.builder()
                .setSubject(userPrincipal.getUsername()) 
                .claim("roles", authorities)
                .claim("id", userPrincipal.getId())
                .claim("name", userPrincipal.getName())
                .setIssuedAt(new Date())
                .setExpiration(expiryDate)
                .signWith(getSigningKey(), SignatureAlgorithm.HS512)
                .compact();
    }

    public String getUsernameFromJWT(String token) { 
        Claims claims = Jwts.parserBuilder()
                .setSigningKey(getSigningKey())
                .build()
                .parseClaimsJws(token)
                .getBody();
        return claims.getSubject();
    }

    public boolean validateToken(String authToken) {
        try {
            Jwts.parserBuilder()
                .setSigningKey(getSigningKey())
                .build()
                .parseClaimsJws(authToken);
            return true;
        } catch (SignatureException ex) { 
            logger.error("Falha na validação da assinatura JWT: {}", ex.getMessage());
        } catch (MalformedJwtException ex) {
            logger.error("Token JWT inválido: {}", ex.getMessage());
        } catch (ExpiredJwtException ex) {
            logger.error("Token JWT expirado: {}", ex.getMessage());
        } catch (UnsupportedJwtException ex) {
            logger.error("Token JWT não suportado: {}", ex.getMessage());
        } catch (IllegalArgumentException ex) {
            logger.error("Claims JWT vazias ou argumento inválido: {}", ex.getMessage());
        }
        return false;
    }
    
    public Authentication getAuthentication(String token) {
        Claims claims = Jwts.parserBuilder()
                .setSigningKey(getSigningKey())
                .build()
                .parseClaimsJws(token)
                .getBody();
        
        String rolesClaim = claims.get("roles", String.class);
        Collection<? extends GrantedAuthority> authorities =
                Arrays.stream(rolesClaim != null ? rolesClaim.split(",") : new String[0])
                        .filter(role -> role != null && !role.trim().isEmpty())
                        .map(SimpleGrantedAuthority::new)
                        .collect(Collectors.toList());
        
        UserDetailsImpl userDetails = new UserDetailsImpl(
                claims.get("id", Long.class),
                claims.get("name", String.class),
                claims.getSubject(), 
                "", 
                authorities,
                true 
        );
        
        return new UsernamePasswordAuthenticationToken(userDetails, token, authorities);
    }
}