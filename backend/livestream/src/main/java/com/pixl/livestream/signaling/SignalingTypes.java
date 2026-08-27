package com.pixl.livestream.signaling;

public final class SignalingTypes {

    private SignalingTypes() {
    }

    public static final String JOIN_STREAM = "JOIN_STREAM";
    public static final String LEAVE_STREAM = "LEAVE_STREAM";
    public static final String OFFER = "OFFER";
    public static final String ANSWER = "ANSWER";
    public static final String ICE_CANDIDATE = "ICE_CANDIDATE";
    public static final String STREAM_STARTED = "STREAM_STARTED";
    public static final String STREAM_ENDED = "STREAM_ENDED";
    public static final String VIEWER_JOINED = "VIEWER_JOINED";
    public static final String VIEWER_LEFT = "VIEWER_LEFT";
    public static final String RECONNECT = "RECONNECT";
    public static final String HEARTBEAT = "HEARTBEAT";
    public static final String CHAT_MESSAGE = "CHAT_MESSAGE";
    public static final String CHAT_DELETE = "CHAT_DELETE";
    public static final String REACTION = "REACTION";
    public static final String ERROR = "ERROR";
    public static final String READY = "READY";
    public static final String ICE_SERVERS = "ICE_SERVERS";
    public static final String MUTE_VIEWER = "MUTE_VIEWER";
    public static final String REMOVE_VIEWER = "REMOVE_VIEWER";
    public static final String VIEWER_COUNT = "VIEWER_COUNT";
    public static final String SUBSCRIBER_OFFER = "SUBSCRIBER_OFFER";
    public static final String CHAT_HISTORY = "CHAT_HISTORY";
}
