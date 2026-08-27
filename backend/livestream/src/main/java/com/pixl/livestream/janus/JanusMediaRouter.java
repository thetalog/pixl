package com.pixl.livestream.janus;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ThreadLocalRandom;
import java.util.concurrent.TimeUnit;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

import com.fasterxml.jackson.databind.JsonNode;
import com.pixl.livestream.common.ApiException;
import com.pixl.livestream.config.LivestreamProperties;
import com.pixl.livestream.media.MediaRouter;
import com.pixl.livestream.media.MediaSession;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
@ConditionalOnProperty(name = "livestream.janus.enabled", havingValue = "true", matchIfMissing = true)
public class JanusMediaRouter implements MediaRouter {

    private final JanusGatewayClient janus;
    private final LivestreamProperties properties;
    private final Map<String, MediaSession> sessions = new ConcurrentHashMap<>();
    private final Map<Long, CompletableFuture<String>> pendingAnswers = new ConcurrentHashMap<>();
    private final Map<Long, CompletableFuture<String>> pendingOffers = new ConcurrentHashMap<>();
    private final Map<Long, CompletableFuture<Long>> pendingJoins = new ConcurrentHashMap<>();

    public JanusMediaRouter(JanusGatewayClient janus, LivestreamProperties properties) {
        this.janus = janus;
        this.properties = properties;
    }

    @Override
    public long createRoom(String streamId, boolean recordingEnabled) {
        long adminSession = janus.createSession();
        long handle = janus.attachVideoRoom(adminSession);
        long roomId = Math.abs(ThreadLocalRandom.current().nextLong(1, Long.MAX_VALUE));
        janus.sendMessage(adminSession, handle, Map.of(
                "request", "create",
                "room", roomId,
                "permanent", false,
                "description", "pixl-" + streamId,
                "publishers", 1,
                "bitrate", properties.getJanus().getBitrateBps(),
                "notify_joining", true,
                "record", recordingEnabled,
                "admin_key", "pixlsupersecret"
        ), null);
        janus.destroySession(adminSession);
        log.info("janus room created streamId={} room={}", streamId, roomId);
        return roomId;
    }

    @Override
    public void destroyRoom(long roomId) {
        try {
            long session = janus.createSession();
            long handle = janus.attachVideoRoom(session);
            janus.sendMessage(session, handle, Map.of("request", "destroy", "room", roomId), null);
            janus.destroySession(session);
            log.info("janus room destroyed {}", roomId);
        } catch (Exception ex) {
            log.warn("janus room destroy failed {}: {}", roomId, ex.getMessage());
        }
    }

    @Override
    public MediaSession attachPublisher(String streamId, long roomId, String userId) {
        MediaSession session = openHandle(streamId, roomId, userId, true);
        CompletableFuture<Long> joined = new CompletableFuture<>();
        pendingJoins.put(session.janusHandleId(), joined);
        JsonNode response = janus.sendMessage(session.janusSessionId(), session.janusHandleId(), Map.of(
                "request", "join",
                "room", roomId,
                "ptype", "publisher",
                "display", userId
        ), null);
        Long feed = extractId(response);
        if (feed != null && feed > 0) {
            session.setFeedId(feed);
            pendingJoins.remove(session.janusHandleId());
            joined.complete(feed);
            return session;
        }
        try {
            long id = joined.orTimeout(properties.getJanus().getTimeoutMs(), TimeUnit.MILLISECONDS).join();
            session.setFeedId(id);
            return session;
        } catch (Exception ex) {
            pendingJoins.remove(session.janusHandleId());
            throw ApiException.unavailable("Janus publisher join failed");
        }
    }

    @Override
    public MediaSession attachSubscriber(String streamId, long roomId, long publisherFeedId, String userId) {
        if (publisherFeedId <= 0) {
            throw ApiException.unavailable("Host is not publishing yet");
        }
        MediaSession session = openHandle(streamId, roomId, userId, false);
        Map<String, Object> join = new HashMap<>();
        join.put("request", "join");
        join.put("room", roomId);
        join.put("ptype", "subscriber");
        join.put("feed", publisherFeedId);
        join.put("streams", List.of(Map.of("feed", publisherFeedId)));
        janus.sendMessage(session.janusSessionId(), session.janusHandleId(), join, null);
        session.setFeedId(publisherFeedId);
        return session;
    }

    @Override
    public CompletableFuture<String> publishOffer(MediaSession session, String sdpOffer) {
        CompletableFuture<String> future = new CompletableFuture<>();
        pendingAnswers.put(session.janusHandleId(), future);
        janus.sendMessage(session.janusSessionId(), session.janusHandleId(), Map.of(
                "request", "publish",
                "audio", true,
                "video", true,
                "record", false
        ), Map.of("type", "offer", "sdp", sdpOffer));
        return future.orTimeout(properties.getJanus().getTimeoutMs(), TimeUnit.MILLISECONDS);
    }

    @Override
    public CompletableFuture<Void> subscribeAnswer(MediaSession session, String sdpAnswer) {
        janus.sendMessage(session.janusSessionId(), session.janusHandleId(), Map.of(
                "request", "start",
                "room", session.roomId()
        ), Map.of("type", "answer", "sdp", sdpAnswer));
        return CompletableFuture.completedFuture(null);
    }

    @Override
    public void trickleIce(MediaSession session, Map<String, Object> candidate) {
        Object value = candidate == null ? null : candidate.get("candidate");
        if (value instanceof String line && line.contains(".local")) {
            return;
        }
        janus.trickle(session.janusSessionId(), session.janusHandleId(), candidate);
    }

    @Override
    public void close(MediaSession session) {
        sessions.remove(session.connectionId());
        pendingAnswers.remove(session.janusHandleId());
        pendingOffers.remove(session.janusHandleId());
        CompletableFuture<Long> join = pendingJoins.remove(session.janusHandleId());
        if (join != null) {
            join.completeExceptionally(new IllegalStateException("media session closed"));
        }
        janus.destroySession(session.janusSessionId());
    }

    @Override
    public boolean isAvailable() {
        return janus.ping();
    }

    @Override
    public CompletableFuture<String> waitForSubscriberOffer(MediaSession session) {
        return pendingOffers.computeIfAbsent(session.janusHandleId(), id -> new CompletableFuture<>())
                .orTimeout(properties.getJanus().getTimeoutMs(), TimeUnit.MILLISECONDS);
    }

    private MediaSession openHandle(String streamId, long roomId, String userId, boolean publisher) {
        long sessionId = janus.createSession();
        long handleId = janus.attachVideoRoom(sessionId);
        MediaSession session = new MediaSession(UUID.randomUUID().toString(), streamId, publisher);
        session.setJanusSessionId(sessionId);
        session.setJanusHandleId(handleId);
        session.setRoomId(roomId);
        sessions.put(session.connectionId(), session);
        janus.startPolling(sessionId, event -> onJanusEvent(session, event));
        return session;
    }

    private void onJanusEvent(MediaSession session, JsonNode event) {
        if (event.has("jsep")) {
            JsonNode jsep = event.get("jsep");
            String type = jsep.path("type").asText();
            String sdp = jsep.path("sdp").asText();
            if ("answer".equals(type)) {
                CompletableFuture<String> pending = pendingAnswers.remove(session.janusHandleId());
                if (pending != null) {
                    pending.complete(sdp);
                }
            } else if ("offer".equals(type)) {
                pendingOffers.computeIfAbsent(session.janusHandleId(), id -> new CompletableFuture<>()).complete(sdp);
            }
        }
        JsonNode data = event.path("plugindata").path("data");
        if ("joined".equals(data.path("videoroom").asText()) && data.has("id")) {
            long id = data.path("id").asLong();
            session.setFeedId(id);
            CompletableFuture<Long> pending = pendingJoins.remove(session.janusHandleId());
            if (pending != null) {
                pending.complete(id);
            }
        }
        if ("trickle".equals(event.path("janus").asText()) && session.eventHandler() != null) {
            JsonNode candidate = event.path("candidate");
            Map<String, Object> evt = new HashMap<>();
            evt.put("janus", "trickle");
            if (candidate.path("completed").asBoolean(false)) {
                evt.put("completed", true);
            } else {
                evt.put("candidate", candidate.path("candidate").asText(""));
                evt.put("sdpMid", candidate.path("sdpMid").asText("0"));
                evt.put("sdpMLineIndex", candidate.path("sdpMLineIndex").asInt(0));
            }
            session.eventHandler().accept(evt);
        }
        if ("event".equals(event.path("janus").asText()) && session.eventHandler() != null) {
            session.eventHandler().accept(Map.of(
                    "janus", event.path("janus").asText(),
                    "videoroom", data.path("videoroom").asText(),
                    "error", data.path("error").asText("")
            ));
        }
        if ("webrtcup".equals(event.path("janus").asText())) {
            log.info("webrtc up stream={} publisher={}", session.streamId(), session.publisher());
        }
        if ("hangup".equals(event.path("janus").asText()) || "error".equals(event.path("janus").asText())) {
            log.warn("janus {} stream={} reason={}", event.path("janus").asText(), session.streamId(), event.path("error").asText());
        }
    }

    private Long extractId(JsonNode joined) {
        JsonNode data = joined.path("plugindata").path("data");
        if (data.has("id")) {
            return data.path("id").asLong();
        }
        return null;
    }
}
