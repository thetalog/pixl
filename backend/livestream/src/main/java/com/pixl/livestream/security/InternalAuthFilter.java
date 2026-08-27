package com.pixl.livestream.security;

import java.io.IOException;

import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import com.pixl.livestream.config.LivestreamProperties;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@Component
public class InternalAuthFilter extends OncePerRequestFilter {

    private final LivestreamProperties properties;

    public InternalAuthFilter(LivestreamProperties properties) {
        this.properties = properties;
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();
        return !path.startsWith("/internal/");
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        String provided = request.getHeader("X-Internal-Secret");
        String expected = properties.getInternalSecret();
        if (expected == null || expected.isBlank() || !expected.equals(provided)) {
            response.setStatus(401);
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            response.getWriter().write("{\"error\":true,\"code\":\"UNAUTHORIZED\",\"message\":\"Invalid internal secret\"}");
            return;
        }
        filterChain.doFilter(request, response);
    }
}
