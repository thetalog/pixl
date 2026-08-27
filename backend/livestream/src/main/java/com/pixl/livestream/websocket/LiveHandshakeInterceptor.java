package com.pixl.livestream.websocket;

import java.util.Map;

import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.http.server.ServletServerHttpRequest;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.server.HandshakeInterceptor;

import com.pixl.livestream.security.LivePrincipal;
import com.pixl.livestream.security.LiveTokenService;

import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
public class LiveHandshakeInterceptor implements HandshakeInterceptor {

    private final LiveTokenService tokens;

    public LiveHandshakeInterceptor(LiveTokenService tokens) {
        this.tokens = tokens;
    }

    @Override
    public boolean beforeHandshake(
            ServerHttpRequest request,
            ServerHttpResponse response,
            WebSocketHandler wsHandler,
            Map<String, Object> attributes
    ) {
        String token = queryParam(request, "token");
        if (token == null && request.getHeaders().getFirst("Authorization") != null) {
            String header = request.getHeaders().getFirst("Authorization");
            if (header != null && header.startsWith("Bearer ")) {
                token = header.substring(7);
            }
        }
        if (token == null || token.isBlank()) {
            log.info("websocket auth failed: missing token");
            return false;
        }
        try {
            LivePrincipal principal = tokens.parse(token);
            attributes.put("principal", principal);
            return true;
        } catch (Exception ex) {
            log.info("websocket auth failed: {}", ex.getMessage());
            return false;
        }
    }

    @Override
    public void afterHandshake(
            ServerHttpRequest request,
            ServerHttpResponse response,
            WebSocketHandler wsHandler,
            Exception exception
    ) {
        // no-op
    }

    private String queryParam(ServerHttpRequest request, String name) {
        if (request instanceof ServletServerHttpRequest servlet) {
            HttpServletRequest http = servlet.getServletRequest();
            return http.getParameter(name);
        }
        String query = request.getURI().getQuery();
        if (query == null) {
            return null;
        }
        for (String part : query.split("&")) {
            String[] pair = part.split("=", 2);
            if (pair.length == 2 && name.equals(pair[0])) {
                return java.net.URLDecoder.decode(pair[1], java.nio.charset.StandardCharsets.UTF_8);
            }
        }
        return null;
    }
}
