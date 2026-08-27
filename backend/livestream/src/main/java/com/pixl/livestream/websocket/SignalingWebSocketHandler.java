package com.pixl.livestream.websocket;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.pixl.livestream.chat.ChatService;
import com.pixl.livestream.common.ApiException;
import com.pixl.livestream.config.LivestreamProperties;
import com.pixl.livestream.entity.LivestreamChatMessageEntity;
import com.pixl.livestream.entity.LivestreamEntity;
import com.pixl.livestream.media.IceService;
import com.pixl.livestream.media.MediaRouter;
import com.pixl.livestream.media.MediaSession;
import com.pixl.livestream.reaction.ReactionService;
import com.pixl.livestream.security.LivePermission;
import com.pixl.livestream.security.LivePrincipal;
import com.pixl.livestream.signaling.SignalingMessage;
import com.pixl.livestream.signaling.SignalingTypes;
import com.pixl.livestream.stream.StreamService;
import com.pixl.livestream.stream.StreamStatus;
import com.pixl.livestream.viewer.PresenceStore;
import com.pixl.livestream.viewer.ViewerService;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
public class SignalingWebSocketHandler extends TextWebSocketHandler {

    private final ObjectMapper mapper;
    private final StreamService streams;
    private final ViewerService viewers;
    private final ChatService chat;
    private final ReactionService reactions;
    private final MediaRouter mediaRouter;
    private final IceService iceService;
    private final LiveSessionRegistry registry;
    private final PresenceStore presence;
    private final LivestreamProperties properties;
    private final Map<String, MediaSession> mediaSessions = new ConcurrentHashMap<>();

    public SignalingWebSocketHandler(
            ObjectMapper mapper,
            StreamService streams,
            ViewerService viewers,
            ChatService chat,
            ReactionService reactions,
            MediaRouter mediaRouter,
            IceService iceService,
            LiveSessionRegistry registry,
            PresenceStore presence,
            LivestreamProperties properties
    ) {
        this.mapper = mapper;
        this.streams = streams;
        this.viewers = viewers;
        this.chat = chat;
        this.reactions = reactions;
        this.mediaRouter = mediaRouter;
        this.iceService = iceService;
        this.registry = registry;
        this.presence = presence;
        this.properties = properties;
    }

    @Override
    public void afterConnectionEstablished(WebSocketSession session) {
        LivePrincipal principal = principal(session);
        registry.register(principal.streamId(), session);
        viewers.join(principal, session.getId());
        send(session, message(SignalingTypes.READY, principal, mapper.createObjectNode()
                .put("connectionId", session.getId())
                .put("role", principal.role().name())));
        send(session, message(SignalingTypes.ICE_SERVERS, principal, mapper.valueToTree(Map.of(
                "iceServers", iceService.iceServers(principal.userId())
        ))));
        sendChatHistory(session, principal);
        publish(principal.streamId(), message(SignalingTypes.VIEWER_JOINED, principal, mapper.createObjectNode()
                .put("userId", principal.userId())
                .put("userName", principal.userName())));
        broadcastViewerCount(principal.streamId());
        log.info("host_connected={}", principal.isHost() ? "yes" : "no");
        if (principal.isHost()) {
            log.info("host connected streamId={} userId={}", principal.streamId(), principal.userId());
        }
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) {
        if (message.getPayloadLength() > properties.getLimits().getMaxWsMessageBytes()) {
            sendError(session, "Message too large");
            return;
        }
        try {
            SignalingMessage incoming = mapper.readValue(message.getPayload(), SignalingMessage.class);
            LivePrincipal principal = principal(session);
            switch (incoming.type() == null ? "" : incoming.type()) {
                case SignalingTypes.JOIN_STREAM, SignalingTypes.RECONNECT -> handleJoinMedia(session, principal);
                case SignalingTypes.OFFER -> handleOffer(session, principal, incoming);
                case SignalingTypes.ANSWER -> handleAnswer(session, principal, incoming);
                case SignalingTypes.ICE_CANDIDATE -> handleIce(session, principal, incoming);
                case SignalingTypes.HEARTBEAT -> viewers.heartbeat(principal.streamId(), session.getId());
                case SignalingTypes.CHAT_MESSAGE -> handleChat(principal, incoming);
                case SignalingTypes.CHAT_DELETE -> handleChatDelete(principal, incoming);
                case SignalingTypes.REACTION -> handleReaction(principal, incoming);
                case SignalingTypes.LEAVE_STREAM -> session.close();
                case SignalingTypes.REMOVE_VIEWER -> handleRemove(principal, incoming);
                default -> sendError(session, "Unknown message type");
            }
        } catch (ApiException ex) {
            sendError(session, ex.getMessage());
        } catch (Exception ex) {
            log.warn("signaling error: {}", ex.getMessage());
            sendError(session, "Signaling error");
        }
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        LivePrincipal principal = (LivePrincipal) session.getAttributes().get("principal");
        if (principal == null) {
            return;
        }
        MediaSession media = mediaSessions.remove(session.getId());
        if (media != null) {
            mediaRouter.close(media);
        }
        registry.unregister(principal.streamId(), session);
        viewers.leave(principal.streamId(), session.getId(), principal.isHost());
        publish(principal.streamId(), message(SignalingTypes.VIEWER_LEFT, principal, mapper.createObjectNode()
                .put("userId", principal.userId())
                .put("userName", principal.userName())));
        broadcastViewerCount(principal.streamId());
        if (principal.isHost()) {
            log.info("host disconnected streamId={}", principal.streamId());
        }
    }

    private void handleJoinMedia(WebSocketSession session, LivePrincipal principal) {
        LivestreamEntity stream = streams.require(UUID.fromString(principal.streamId()));
        if (stream.getJanusRoomId() == null) {
            sendError(session, "Media room is not ready");
            return;
        }
        MediaSession existing = mediaSessions.get(session.getId());
        if (principal.isHost() && existing != null && existing.publisher()) {
            send(session, message(SignalingTypes.READY, principal, mapper.createObjectNode()
                    .put("media", "publisher")
                    .put("reconnect", true)));
            return;
        }
        if (existing != null) {
            mediaRouter.close(existing);
            mediaSessions.remove(session.getId());
        }
        if (principal.isHost() && principal.has(LivePermission.PUBLISH)) {
            MediaSession media = mediaRouter.attachPublisher(principal.streamId(), stream.getJanusRoomId(), principal.userId());
            mediaSessions.put(session.getId(), media);
            forwardJanusIce(session, principal, media);
            send(session, message(SignalingTypes.READY, principal, mapper.createObjectNode()
                    .put("media", "publisher")
                    .put("reconnect", true)));
            return;
        }
        if (stream.getPublisherFeedId() == null || stream.getPublisherFeedId() <= 0) {
            sendError(session, "Host is not publishing yet");
            return;
        }
        MediaSession media = mediaRouter.attachSubscriber(
                principal.streamId(), stream.getJanusRoomId(), stream.getPublisherFeedId(), principal.userId()
        );
        mediaSessions.put(session.getId(), media);
        forwardJanusIce(session, principal, media);
        mediaRouter.waitForSubscriberOffer(media).thenAccept(sdp -> {
            if (sdp == null) {
                return;
            }
            ObjectNode payload = mapper.createObjectNode();
            payload.put("sdp", sdp);
            payload.put("type", "offer");
            send(session, message(SignalingTypes.SUBSCRIBER_OFFER, principal, payload));
        }).exceptionally(ex -> {
            log.warn("subscriber offer failed: {}", ex.getMessage());
            sendError(session, "WebRTC negotiation failed");
            return null;
        });
    }

    private void handleOffer(WebSocketSession session, LivePrincipal principal, SignalingMessage incoming) {
        streams.assertPermission(principal, LivePermission.PUBLISH);
        MediaSession media = mediaSessions.get(session.getId());
        if (media == null) {
            sendError(session, "Join the stream before publishing");
            return;
        }
        final MediaSession publishing = media;
        String sdp = text(incoming.payload(), "sdp");
        mediaRouter.publishOffer(publishing, sdp).thenAccept(answer -> {
            ObjectNode payload = mapper.createObjectNode();
            payload.put("sdp", answer);
            payload.put("type", "answer");
            send(session, message(SignalingTypes.ANSWER, principal, payload));
            streams.markLive(UUID.fromString(principal.streamId()), publishing.feedId());
            publish(principal.streamId(), message(SignalingTypes.STREAM_STARTED, principal, mapper.createObjectNode()
                    .put("status", StreamStatus.LIVE.name())));
        }).exceptionally(ex -> {
            log.warn("webrtc negotiation failure streamId={}: {}", principal.streamId(), ex.getMessage());
            sendError(session, "WebRTC negotiation failed");
            return null;
        });
    }

    private void handleAnswer(WebSocketSession session, LivePrincipal principal, SignalingMessage incoming) {
        MediaSession media = mediaSessions.get(session.getId());
        if (media == null) {
            sendError(session, "Media session missing");
            return;
        }
        mediaRouter.subscribeAnswer(media, text(incoming.payload(), "sdp"));
    }

    private void handleIce(WebSocketSession session, LivePrincipal principal, SignalingMessage incoming) {
        MediaSession media = mediaSessions.get(session.getId());
        if (media == null || incoming.payload() == null) {
            return;
        }
        Map<String, Object> raw = mapper.convertValue(incoming.payload(), Map.class);
        Map<String, Object> candidate = new HashMap<>();
        Object completed = raw.get("completed");
        Object value = raw.get("candidate");
        if (Boolean.TRUE.equals(completed) || value == null || "".equals(value)) {
            candidate.put("completed", true);
        } else if (String.valueOf(value).contains(".local")) {
            return;
        } else {
            candidate.put("candidate", value);
            candidate.put("sdpMid", raw.getOrDefault("sdpMid", "0"));
            candidate.put("sdpMLineIndex", raw.getOrDefault("sdpMLineIndex", 0));
        }
        mediaRouter.trickleIce(media, candidate);
    }

    private void forwardJanusIce(WebSocketSession session, LivePrincipal principal, MediaSession media) {
        media.setEventHandler(evt -> {
            if (!"trickle".equals(String.valueOf(evt.get("janus")))) {
                return;
            }
            if (Boolean.TRUE.equals(evt.get("completed"))) {
                return;
            }
            ObjectNode payload = mapper.createObjectNode();
            payload.put("candidate", String.valueOf(evt.getOrDefault("candidate", "")));
            payload.put("sdpMid", String.valueOf(evt.getOrDefault("sdpMid", "0")));
            Object mLine = evt.get("sdpMLineIndex");
            payload.put("sdpMLineIndex", mLine instanceof Number number ? number.intValue() : 0);
            send(session, message(SignalingTypes.ICE_CANDIDATE, principal, payload));
        });
    }

    private void sendChatHistory(WebSocketSession session, LivePrincipal principal) {
        try {
            var recent = chat.recent(UUID.fromString(principal.streamId()));
            ObjectNode payload = mapper.createObjectNode();
            payload.set("messages", mapper.valueToTree(recent.stream().map(row -> Map.of(
                    "id", row.getId().toString(),
                    "message", row.getBody() == null ? "" : row.getBody(),
                    "userId", row.getUserId() == null ? "" : row.getUserId(),
                    "userName", row.getUsername() == null ? "" : row.getUsername(),
                    "avatarUrl", row.getAvatarUrl() == null ? "" : row.getAvatarUrl(),
                    "timestamp", row.getCreatedAt() == null ? "" : row.getCreatedAt().toString()
            )).toList()));
            send(session, message(SignalingTypes.CHAT_HISTORY, principal, payload));
        } catch (Exception ex) {
            log.debug("chat history failed: {}", ex.getMessage());
        }
    }

    private void handleChat(LivePrincipal principal, SignalingMessage incoming) {
        String body = text(incoming.payload(), "message");
        if (body.isBlank()) {
            body = text(incoming.payload(), "text");
        }
        LivestreamChatMessageEntity saved = chat.send(principal, body);
        ObjectNode payload = mapper.createObjectNode();
        payload.put("id", saved.getId().toString());
        payload.put("message", saved.getBody());
        payload.put("userId", saved.getUserId());
        payload.put("userName", saved.getUsername());
        payload.put("avatarUrl", saved.getAvatarUrl());
        payload.put("timestamp", saved.getCreatedAt().toString());
        publish(principal.streamId(), message(SignalingTypes.CHAT_MESSAGE, principal, payload));
    }

    private void handleChatDelete(LivePrincipal principal, SignalingMessage incoming) {
        UUID id = UUID.fromString(text(incoming.payload(), "id"));
        chat.delete(principal, id);
        publish(principal.streamId(), message(SignalingTypes.CHAT_DELETE, principal, incoming.payload()));
    }

    private void handleReaction(LivePrincipal principal, SignalingMessage incoming) {
        String kind = text(incoming.payload(), "kind");
        long total = reactions.react(principal, kind);
        ObjectNode payload = mapper.createObjectNode();
        payload.put("kind", kind.isBlank() ? "LIKE" : kind.toUpperCase());
        payload.put("total", total);
        publish(principal.streamId(), message(SignalingTypes.REACTION, principal, payload));
    }

    private void handleRemove(LivePrincipal principal, SignalingMessage incoming) {
        streams.assertPermission(principal, LivePermission.REMOVE_VIEWER);
        String target = text(incoming.payload(), "userId");
        presence.list(principal.streamId()).stream()
                .filter(v -> v.viewerId().equals(target))
                .forEach(v -> {
                    WebSocketSession targetSession = registry.byConnectionId(v.connectionId());
                    if (targetSession != null && targetSession.isOpen()) {
                        sendError(targetSession, "Removed by moderator");
                        try {
                            targetSession.close(CloseStatus.NORMAL);
                        } catch (Exception ignored) {
                            // ignore
                        }
                    }
                });
    }

    private void broadcastViewerCount(String streamId) {
        ObjectNode payload = mapper.createObjectNode();
        payload.put("viewerCount", presence.count(streamId));
        publish(streamId, message(SignalingTypes.VIEWER_COUNT, null, payload));
    }

    private void publish(String streamId, String json) {
        presence.publish("live:events:" + streamId, json);
    }

    private LivePrincipal principal(WebSocketSession session) {
        Object value = session.getAttributes().get("principal");
        if (!(value instanceof LivePrincipal principal)) {
            throw ApiException.unauthorized("Not authenticated");
        }
        return principal;
    }

    private void send(WebSocketSession session, String json) {
        registry.sendTo(session, json);
    }

    private void sendError(WebSocketSession session, String error) {
        ObjectNode payload = mapper.createObjectNode();
        payload.put("message", error);
        send(session, message(SignalingTypes.ERROR, null, payload));
    }

    private String message(String type, LivePrincipal principal, JsonNode payload) {
        try {
            ObjectNode node = mapper.createObjectNode();
            node.put("type", type);
            if (principal != null) {
                node.put("streamId", principal.streamId());
                node.put("senderId", principal.userId());
            }
            node.set("payload", payload == null ? mapper.createObjectNode() : payload);
            return mapper.writeValueAsString(node);
        } catch (Exception ex) {
            return "{\"type\":\"ERROR\",\"payload\":{\"message\":\"encode failed\"}}";
        }
    }

    private String text(JsonNode payload, String field) {
        if (payload == null || payload.isNull()) {
            return "";
        }
        JsonNode value = payload.get(field);
        return value == null || value.isNull() ? "" : value.asText();
    }
}
