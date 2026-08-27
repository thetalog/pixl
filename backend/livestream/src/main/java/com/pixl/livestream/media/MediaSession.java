package com.pixl.livestream.media;

import java.util.Map;
import java.util.function.Consumer;

public class MediaSession {

    private final String connectionId;
    private final String streamId;
    private final boolean publisher;
    private long janusSessionId;
    private long janusHandleId;
    private long roomId;
    private long feedId;
    private Consumer<Map<String, Object>> eventHandler;

    public MediaSession(String connectionId, String streamId, boolean publisher) {
        this.connectionId = connectionId;
        this.streamId = streamId;
        this.publisher = publisher;
    }

    public String connectionId() {
        return connectionId;
    }

    public String streamId() {
        return streamId;
    }

    public boolean publisher() {
        return publisher;
    }

    public long janusSessionId() {
        return janusSessionId;
    }

    public void setJanusSessionId(long janusSessionId) {
        this.janusSessionId = janusSessionId;
    }

    public long janusHandleId() {
        return janusHandleId;
    }

    public void setJanusHandleId(long janusHandleId) {
        this.janusHandleId = janusHandleId;
    }

    public long roomId() {
        return roomId;
    }

    public void setRoomId(long roomId) {
        this.roomId = roomId;
    }

    public long feedId() {
        return feedId;
    }

    public void setFeedId(long feedId) {
        this.feedId = feedId;
    }

    public Consumer<Map<String, Object>> eventHandler() {
        return eventHandler;
    }

    public void setEventHandler(Consumer<Map<String, Object>> eventHandler) {
        this.eventHandler = eventHandler;
    }
}
