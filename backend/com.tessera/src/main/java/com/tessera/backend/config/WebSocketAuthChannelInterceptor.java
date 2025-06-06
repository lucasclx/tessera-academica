package com.tessera.backend.config;

import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.lang.NonNull;
import com.tessera.backend.security.JwtTokenProvider;

@Component
public class WebSocketAuthChannelInterceptor implements ChannelInterceptor {

    @Autowired
    private JwtTokenProvider tokenProvider;

    @Override
    public Message<?> preSend(@NonNull Message<?> message, @NonNull MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
        if (accessor == null) {
            return message;
        }
        
        if (StompCommand.CONNECT.equals(accessor.getCommand())) {
            List<String> authorization = accessor.getNativeHeader("Authorization");
            
            if (authorization != null && !authorization.isEmpty()) {
                String token = authorization.get(0);
                
                if (token.startsWith("Bearer ")) {
                    token = token.substring(7);
                }
                
                if (tokenProvider.validateToken(token)) {
                    Authentication auth = tokenProvider.getAuthentication(token);
                    SecurityContextHolder.getContext().setAuthentication(auth);
                    accessor.setUser(auth);
                }
            }
        }
        
        return message;
    }
}