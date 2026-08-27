package com.pixl.livestream.viewer;

import java.util.List;
import java.util.Optional;

public interface PresenceStore {

    void put(ViewerPresence presence);

    void heartbeat(String streamId, String connectionId);

    void remove(String streamId, String connectionId);

    List<ViewerPresence> list(String streamId);

    int count(String streamId);

    Optional<ViewerPresence> get(String streamId, String connectionId);

    List<ViewerPresence> expired(String streamId, java.time.Duration timeout);

    void publish(String channel, String payload);

    void incrReaction(String streamId, String kind, long amount);

    long getReaction(String streamId, String kind);

    boolean chatRateAllow(String streamId, String userId, int limitPerMinute);

    void setHostConnection(String streamId, String connectionId);

    Optional<String> getHostConnection(String streamId);

    void markHostDisconnect(String streamId, java.time.Instant until);

    Optional<java.time.Instant> hostReconnectDeadline(String streamId);

    void clearHostDisconnect(String streamId);
}
