package com.pixl.livestream.reaction;

import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import com.pixl.livestream.security.LivePermission;
import com.pixl.livestream.security.LivePrincipal;
import com.pixl.livestream.stream.StreamService;
import com.pixl.livestream.viewer.PresenceStore;

@Service
public class ReactionService {

    private final PresenceStore presence;
    private final StreamService streams;
    private final Map<UUID, AtomicLong> pendingLikes = new ConcurrentHashMap<>();

    public ReactionService(PresenceStore presence, StreamService streams) {
        this.presence = presence;
        this.streams = streams;
    }

    public long react(LivePrincipal principal, String kind) {
        streams.assertPermission(principal, LivePermission.LIKE);
        String type = kind == null || kind.isBlank() ? "LIKE" : kind.toUpperCase();
        presence.incrReaction(principal.streamId(), type, 1);
        if ("LIKE".equals(type) || "HEART".equals(type)) {
            pendingLikes.computeIfAbsent(UUID.fromString(principal.streamId()), k -> new AtomicLong()).incrementAndGet();
        }
        return presence.getReaction(principal.streamId(), type);
    }

    public long likes(UUID streamId) {
        return presence.getReaction(streamId.toString(), "LIKE")
                + presence.getReaction(streamId.toString(), "HEART");
    }

    @Scheduled(fixedDelay = 5000)
    public void flush() {
        pendingLikes.forEach((streamId, counter) -> {
            long amount = counter.getAndSet(0);
            if (amount > 0) {
                try {
                    streams.addLikes(streamId, amount);
                } catch (Exception ignored) {
                    counter.addAndGet(amount);
                }
            }
        });
    }
}
