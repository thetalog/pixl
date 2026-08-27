package com.pixl.livestream.websocket;

import java.io.IOException;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.stereotype.Component;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
public class LiveSessionRegistry {

    private final Map<String, Set<WebSocketSession>> byStream = new ConcurrentHashMap<>();
    private final Map<String, WebSocketSession> byConnection = new ConcurrentHashMap<>();

    public void register(String streamId, WebSocketSession session) {
        byStream.computeIfAbsent(streamId, k -> ConcurrentHashMap.newKeySet()).add(session);
        byConnection.put(session.getId(), session);
    }

    public void unregister(String streamId, WebSocketSession session) {
        Set<WebSocketSession> set = byStream.get(streamId);
        if (set != null) {
            set.remove(session);
        }
        byConnection.remove(session.getId());
    }

    public void broadcast(String streamId, String json) {
        Set<WebSocketSession> set = byStream.get(streamId);
        if (set == null) {
            return;
        }
        TextMessage message = new TextMessage(json);
        for (WebSocketSession session : set) {
            send(session, message);
        }
    }

    public void sendTo(WebSocketSession session, String json) {
        send(session, new TextMessage(json));
    }

    public WebSocketSession byConnectionId(String connectionId) {
        return byConnection.get(connectionId);
    }

    private void send(WebSocketSession session, TextMessage message) {
        if (session == null || !session.isOpen()) {
            return;
        }
        synchronized (session) {
            try {
                session.sendMessage(message);
            } catch (IOException ex) {
                log.debug("ws send failed {}: {}", session.getId(), ex.getMessage());
            }
        }
    }
}
