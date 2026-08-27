package com.pixl.livestream.viewer;

import java.time.Instant;

public record ViewerPresence(
        String streamId,
        String viewerId,
        String userName,
        String connectionId,
        Instant joinedAt,
        Instant lastHeartbeat
) {
}
