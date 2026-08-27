package com.pixl.livestream.signaling;

import com.fasterxml.jackson.databind.JsonNode;

public record SignalingMessage(
        String type,
        String streamId,
        String senderId,
        String connectionId,
        JsonNode payload
) {
}
