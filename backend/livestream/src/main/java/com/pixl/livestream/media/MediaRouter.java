package com.pixl.livestream.media;

import java.util.Map;
import java.util.concurrent.CompletableFuture;

public interface MediaRouter {

    long createRoom(String streamId, boolean recordingEnabled);

    void destroyRoom(long roomId);

    MediaSession attachPublisher(String streamId, long roomId, String userId);

    MediaSession attachSubscriber(String streamId, long roomId, long publisherFeedId, String userId);

    CompletableFuture<String> publishOffer(MediaSession session, String sdpOffer);

    CompletableFuture<Void> subscribeAnswer(MediaSession session, String sdpAnswer);

    void trickleIce(MediaSession session, Map<String, Object> candidate);

    void close(MediaSession session);

    boolean isAvailable();

    default boolean roomExists(long roomId) {
        return true;
    }

    default CompletableFuture<String> waitForSubscriberOffer(MediaSession session) {
        return CompletableFuture.completedFuture(null);
    }
}
