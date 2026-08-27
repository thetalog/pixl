package com.pixl.livestream.websocket;

import org.springframework.stereotype.Component;

import com.pixl.livestream.viewer.InMemoryPresenceStore;

import jakarta.annotation.PostConstruct;

@Component
public class LocalLiveFanout {

    private final InMemoryPresenceStore memory;
    private final LiveSessionRegistry registry;

    public LocalLiveFanout(InMemoryPresenceStore memory, LiveSessionRegistry registry) {
        this.memory = memory;
        this.registry = registry;
    }

    @PostConstruct
    public void subscribe() {
        memory.addListener((channel, payload) -> {
            if (channel != null && channel.startsWith("live:events:")) {
                registry.broadcast(channel.substring("live:events:".length()), payload);
            }
        });
    }
}
