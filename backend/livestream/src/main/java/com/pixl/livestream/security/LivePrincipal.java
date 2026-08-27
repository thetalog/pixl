package com.pixl.livestream.security;

import java.util.List;

public record LivePrincipal(
        String userId,
        String email,
        String userName,
        String displayName,
        String avatarUrl,
        String streamId,
        String pixlStreamId,
        LiveRole role,
        List<LivePermission> permissions
) {
    public boolean has(LivePermission permission) {
        return permissions != null && permissions.contains(permission);
    }

    public boolean isHost() {
        return role == LiveRole.HOST || role == LiveRole.ADMIN;
    }

    public boolean isModerator() {
        return role == LiveRole.MODERATOR || isHost();
    }
}
