package com.tessera.backend.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import io.jsonwebtoken.security.SignatureException; // Import específico para SignatureException
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
// import org.springframework.security.core.userdetails.UserDetails; // Não é estritamente necessário aqui
import org.springframework.stereotype.Component;

import java.security.Key;
import java.util.Arrays;
import java.util.Collection;
import java.util.Date;
import java.util.stream.Collectors;

@Component
public class JwtTokenProvider {

    private static final Logger logger = LoggerFactory.getLogger(JwtTokenProvider.class);

    @Value("${app.jwt.secret}")
    private String jwtSecret;

    @Value("${app.jwt.expiration}")
    private int jwtExpirationInMs;

    private Key getSigningKey() {
        byte[] keyBytes = jwtSecret.getBytes();
        // Para HS512, a chave deve ter um tamanho adequado (ex: 64 bytes).
        // Se a chave for menor, pode ser necessário usar SignatureAlgorithm.HS256
        // ou garantir que a chave em application.properties seja longa o suficiente.
        return Keys.hmacShaKeyFor(keyBytes);
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
                .claim("id", userPrincipal.getId())         // CLAIM "id" ADICIONADO
                .claim("name", userPrincipal.getName())     // CLAIM "name" ADICIONADO
                .setIssuedAt(new Date())
                .setExpiration(expiryDate)
                .signWith(getSigningKey(), SignatureAlgorithm.HS512) // Especificando algoritmo
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
        } catch (MalformedJwtException ex) {
            logger.error("Token JWT inválido: {}", ex.getMessage());
        } catch (ExpiredJwtException ex) {
            logger.error("Token JWT expirado: {}", ex.getMessage());
        } catch (UnsupportedJwtException ex) {
            logger.error("Token JWT não suportado: {}", ex.getMessage());
        } catch (IllegalArgumentException ex) {
            logger.error("Claims JWT vazias: {}", ex.getMessage());
        } catch (SignatureException ex) { 
            logger.error("Falha na validação da assinatura JWT: {}", ex.getMessage());
        }
        return false;
    }
    
    public Authentication getAuthentication(String token) {
        Claims claims = Jwts.parserBuilder()
                .setSigningKey(getSigningKey())
                .build()
                .parseClaimsJws(token)
                .getBody();
        
        String rolesClaim = claims.get("roles", String.class); // Obter como String
        Collection<? extends GrantedAuthority> authorities =
                Arrays.stream(rolesClaim != null ? rolesClaim.split(",") : new String[0])
                        .map(SimpleGrantedAuthority::new)
                        .collect(Collectors.toList());
        
        org.springframework.security.core.userdetails.User principal = 
                new org.springframework.security.core.userdetails.User(claims.getSubject(), "", authorities);
        
        return new UsernamePasswordAuthenticationToken(principal, token, authorities);
    }
}