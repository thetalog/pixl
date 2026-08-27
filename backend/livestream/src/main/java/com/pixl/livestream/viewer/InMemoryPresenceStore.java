package com.pixl.livestream.viewer;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.concurrent.atomic.AtomicLong;
import java.util.function.BiConsumer;

import org.springframework.stereotype.Component;

@Component
public class InMemoryPresenceStore implements PresenceStore {

    private final Map<String, Map<String, ViewerPresence>> viewers = new ConcurrentHashMap<>();
    private final Map<String, Map<String, AtomicLong>> reactions = new ConcurrentHashMap<>();
    private final Map<String, List<Long>> chatHits = new ConcurrentHashMap<>();
    private final Map<String, String> hosts = new ConcurrentHashMap<>();
    private final Map<String, Instant> hostDeadlines = new ConcurrentHashMap<>();
    private final List<BiConsumer<String, String>> listeners = new CopyOnWriteArrayList<>();

    public void addListener(BiConsumer<String, String> listener) {
        listeners.add(listener);
    }

    @Override
    public void put(ViewerPresence presence) {
        viewers.computeIfAbsent(presence.streamId(), k -> new ConcurrentHashMap<>())
                .put(presence.connectionId(), presence);
    }

    @Override
    public void heartbeat(String streamId, String connectionId) {
        Map<String, ViewerPresence> map = viewers.get(streamId);
        if (map == null) {
            return;
        }
        ViewerPresence current = map.get(connectionId);
        if (current != null) {
            map.put(connectionId, new ViewerPresence(
                    current.streamId(), current.viewerId(), current.userName(), current.connectionId(),
                    current.joinedAt(), Instant.now()
            ));
        }
    }

    @Override
    public void remove(String streamId, String connectionId) {
        Map<String, ViewerPresence> map = viewers.get(streamId);
        if (map != null) {
            map.remove(connectionId);
        }
    }

    @Override
    public List<ViewerPresence> list(String streamId) {
        Map<String, ViewerPresence> map = viewers.get(streamId);
        if (map == null) {
            return List.of();
        }
        return List.copyOf(map.values());
    }

    @Override
    public int count(String streamId) {
        Map<String, ViewerPresence> map = viewers.get(streamId);
        return map == null ? 0 : map.size();
    }

    @Override
    public Optional<ViewerPresence> get(String streamId, String connectionId) {
        Map<String, ViewerPresence> map = viewers.get(streamId);
        return map == null ? Optional.empty() : Optional.ofNullable(map.get(connectionId));
    }

    @Override
    public List<ViewerPresence> expired(String streamId, Duration timeout) {
        Instant cutoff = Instant.now().minus(timeout);
        List<ViewerPresence> expired = new ArrayList<>();
        for (ViewerPresence presence : list(streamId)) {
            if (presence.lastHeartbeat().isBefore(cutoff)) {
                expired.add(presence);
            }
        }
        return expired;
    }

    @Override
    public void publish(String channel, String payload) {
        listeners.forEach(listener -> listener.accept(channel, payload));
    }

    @Override
    public void incrReaction(String streamId, String kind, long amount) {
        reactions.computeIfAbsent(streamId, k -> new ConcurrentHashMap<>())
                .computeIfAbsent(kind, k -> new AtomicLong())
                .addAndGet(amount);
    }

    @Override
    public long getReaction(String streamId, String kind) {
        Map<String, AtomicLong> map = reactions.get(streamId);
        if (map == null || map.get(kind) == null) {
            return 0;
        }
        return map.get(kind).get();
    }

    @Override
    public boolean chatRateAllow(String streamId, String userId, int limitPerMinute) {
        String key = streamId + ":" + userId;
        long now = System.currentTimeMillis();
        List<Long> hits = chatHits.computeIfAbsent(key, k -> new CopyOnWriteArrayList<>());
        hits.removeIf(ts -> now - ts > 60_000);
        if (hits.size() >= limitPerMinute) {
            return false;
        }
        hits.add(now);
        return true;
    }

    @Override
    public void setHostConnection(String streamId, String connectionId) {
        hosts.put(streamId, connectionId);
    }

    @Override
    public Optional<String> getHostConnection(String streamId) {
        return Optional.ofNullable(hosts.get(streamId));
    }

    @Override
    public void markHostDisconnect(String streamId, Instant until) {
        hostDeadlines.put(streamId, until);
    }

    @Override
    public Optional<Instant> hostReconnectDeadline(String streamId) {
        return Optional.ofNullable(hostDeadlines.get(streamId));
    }

    @Override
    public void clearHostDisconnect(String streamId) {
        hostDeadlines.remove(streamId);
    }
}
