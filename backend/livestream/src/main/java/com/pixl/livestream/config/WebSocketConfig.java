package com.pixl.livestream.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;

import com.pixl.livestream.websocket.LiveHandshakeInterceptor;
import com.pixl.livestream.websocket.SignalingWebSocketHandler;

@Configuration
@EnableWebSocket
public class WebSocketConfig implements WebSocketConfigurer {

    private final SignalingWebSocketHandler handler;
    private final LiveHandshakeInterceptor interceptor;
    private final LivestreamProperties properties;

    public WebSocketConfig(
            SignalingWebSocketHandler handler,
            LiveHandshakeInterceptor interceptor,
            LivestreamProperties properties
    ) {
        this.handler = handler;
        this.interceptor = interceptor;
        this.properties = properties;
    }

    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        registry.addHandler(handler, properties.getWsPath())
                .addInterceptors(interceptor)
                .setAllowedOriginPatterns("*");
    }
}
