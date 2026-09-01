package com.pixl.livestream.dto;

import java.util.List;

import com.pixl.livestream.security.LivePermission;
import com.pixl.livestream.security.LiveRole;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public final class StreamDtos {

    private StreamDtos() {
    }

    public record CreateStreamRequest(
            @NotBlank String pixlStreamId,
            @NotBlank String hostUserId,
            @NotBlank String hostUsername,
            String hostDisplayName,
            String hostAvatarUrl,
            @NotBlank @Size(max = 200) String title,
            String visibility,
            Boolean recordingEnabled
    ) {
    }

    public record StartStreamRequest(
            String actorUserId
    ) {
    }

    public record ForceEndRequest(
            String actorUserId,
            String reason
    ) {
    }

    public record JoinStreamRequest(
            @NotBlank String userId,
            @NotBlank String userName,
            String displayName,
            String avatarUrl,
            LiveRole role
    ) {
    }

    public record IceServer(
            List<String> urls,
            String username,
            String credential
    ) {
    }

    public record SessionPayload(
            String token,
            String signalingUrl,
            String streamId,
            String pixlStreamId,
            LiveRole role,
            List<LivePermission> permissions,
            List<IceServer> iceServers
    ) {
    }

    public record StreamView(
            String streamId,
            String pixlStreamId,
            String hostUserId,
            String hostUsername,
            String hostDisplayName,
            String hostAvatarUrl,
            String title,
            String status,
            String visibility,
            boolean recordingEnabled,
            int viewerCount,
            long likeCount,
            String createdAt,
            String startedAt,
            String endedAt,
            String signalingUrl
    ) {
    }

    public record CreateStreamResponse(
            StreamView stream,
            SessionPayload session
    ) {
    }

    public record ViewerView(
            String userId,
            String userName,
            String connectionId,
            String joinedAt
    ) {
    }
}
