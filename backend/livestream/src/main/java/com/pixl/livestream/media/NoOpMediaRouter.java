package com.pixl.livestream.media;

import java.util.Map;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ThreadLocalRandom;
import java.util.concurrent.atomic.AtomicLong;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

import lombok.extern.slf4j.Slf4j;

/**
 * Used in tests and when Janus is disabled. Does not move media.
 */
@Slf4j
@Component
@ConditionalOnProperty(name = "livestream.janus.enabled", havingValue = "false")
public class NoOpMediaRouter implements MediaRouter {

    private final AtomicLong rooms = new AtomicLong(1000);
    private final Map<String, MediaSession> sessions = new ConcurrentHashMap<>();

    @Override
    public long createRoom(String streamId, boolean recordingEnabled) {
        return rooms.incrementAndGet();
    }

    @Override
    public void destroyRoom(long roomId) {
        log.info("noop media: destroy room {}", roomId);
    }

    @Override
    public MediaSession attachPublisher(String streamId, long roomId, String userId) {
        MediaSession session = new MediaSession(userId + "-pub", streamId, true);
        session.setRoomId(roomId);
        session.setFeedId(ThreadLocalRandom.current().nextLong(1, Long.MAX_VALUE));
        sessions.put(session.connectionId(), session);
        return session;
    }

    @Override
    public MediaSession attachSubscriber(String streamId, long roomId, long publisherFeedId, String userId) {
        MediaSession session = new MediaSession(userId + "-sub-" + ThreadLocalRandom.current().nextInt(), streamId, false);
        session.setRoomId(roomId);
        session.setFeedId(publisherFeedId);
        sessions.put(session.connectionId(), session);
        return session;
    }

    @Override
    public CompletableFuture<String> publishOffer(MediaSession session, String sdpOffer) {
        return CompletableFuture.completedFuture(sdpOffer.replace("a=sendonly", "a=recvonly"));
    }

    @Override
    public CompletableFuture<Void> subscribeAnswer(MediaSession session, String sdpAnswer) {
        return CompletableFuture.completedFuture(null);
    }

    @Override
    public void trickleIce(MediaSession session, Map<String, Object> candidate) {
        // no-op
    }

    @Override
    public void close(MediaSession session) {
        sessions.remove(session.connectionId());
    }

    @Override
    public boolean isAvailable() {
        return true;
    }

    @Override
    public CompletableFuture<String> waitForSubscriberOffer(MediaSession session) {
        return CompletableFuture.completedFuture("v=0\r\no=- 0 0 IN IP4 127.0.0.1\r\ns=-\r\nt=0 0\r\n");
    }
}
