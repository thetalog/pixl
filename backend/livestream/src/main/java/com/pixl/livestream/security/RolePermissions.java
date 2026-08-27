package com.pixl.livestream.security;

import java.util.List;

public final class RolePermissions {

    private RolePermissions() {
    }

    public static List<LivePermission> forRole(LiveRole role) {
        return switch (role) {
            case HOST, ADMIN -> List.of(
                    LivePermission.CREATE_STREAM,
                    LivePermission.START_STREAM,
                    LivePermission.END_STREAM,
                    LivePermission.PUBLISH,
                    LivePermission.JOIN_STREAM,
                    LivePermission.LEAVE_STREAM,
                    LivePermission.COMMENT,
                    LivePermission.LIKE,
                    LivePermission.MUTE_VIEWER,
                    LivePermission.REMOVE_VIEWER,
                    LivePermission.DELETE_COMMENT
            );
            case MODERATOR -> List.of(
                    LivePermission.JOIN_STREAM,
                    LivePermission.LEAVE_STREAM,
                    LivePermission.COMMENT,
                    LivePermission.LIKE,
                    LivePermission.MUTE_VIEWER,
                    LivePermission.REMOVE_VIEWER,
                    LivePermission.DELETE_COMMENT
            );
            case VIEWER -> List.of(
                    LivePermission.JOIN_STREAM,
                    LivePermission.LEAVE_STREAM,
                    LivePermission.COMMENT,
                    LivePermission.LIKE
            );
        };
    }
}
