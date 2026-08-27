package com.pixl.livestream.chat;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import com.pixl.livestream.common.ApiException;
import com.pixl.livestream.dto.StreamDtos.CreateStreamRequest;
import com.pixl.livestream.security.LivePrincipal;
import com.pixl.livestream.security.LiveRole;
import com.pixl.livestream.security.RolePermissions;
import com.pixl.livestream.stream.StreamService;

@SpringBootTest
@ActiveProfiles("test")
class ChatServiceTest {

    @Autowired
    ChatService chat;

    @Autowired
    StreamService streams;

    @Test
    void sendAndModerateComment() {
        var created = streams.create(new CreateStreamRequest(
                "pixl-chat-" + System.nanoTime(), "host-c", "host", "Host", null, "Chat", "PUBLIC", false
        ));
        LivePrincipal viewer = new LivePrincipal(
                "v1", "", "viewer", "Viewer", "", created.stream().streamId(), created.stream().pixlStreamId(),
                LiveRole.VIEWER, RolePermissions.forRole(LiveRole.VIEWER)
        );
        var saved = chat.send(viewer, "hello live");
        assertThat(saved.getBody()).isEqualTo("hello live");

        LivePrincipal host = new LivePrincipal(
                "host-c", "", "host", "Host", "", created.stream().streamId(), created.stream().pixlStreamId(),
                LiveRole.HOST, RolePermissions.forRole(LiveRole.HOST)
        );
        var deleted = chat.delete(host, saved.getId());
        assertThat(deleted.isDeleted()).isTrue();
    }

    @Test
    void rejectsEmptyAndTooLong() {
        var created = streams.create(new CreateStreamRequest(
                "pixl-chat2-" + System.nanoTime(), "host-c2", "host", "Host", null, "Chat", "PUBLIC", false
        ));
        LivePrincipal viewer = new LivePrincipal(
                "v2", "", "viewer", "Viewer", "", created.stream().streamId(), created.stream().pixlStreamId(),
                LiveRole.VIEWER, RolePermissions.forRole(LiveRole.VIEWER)
        );
        assertThatThrownBy(() -> chat.send(viewer, "   ")).isInstanceOf(ApiException.class);
        assertThatThrownBy(() -> chat.send(viewer, "x".repeat(500))).isInstanceOf(ApiException.class);
    }

    @Test
    void viewerCannotDelete() {
        var created = streams.create(new CreateStreamRequest(
                "pixl-chat3-" + System.nanoTime(), "host-c3", "host", "Host", null, "Chat", "PUBLIC", false
        ));
        LivePrincipal viewer = new LivePrincipal(
                "v3", "", "viewer", "Viewer", "", created.stream().streamId(), created.stream().pixlStreamId(),
                LiveRole.VIEWER, RolePermissions.forRole(LiveRole.VIEWER)
        );
        var saved = chat.send(viewer, "keep me");
        assertThatThrownBy(() -> chat.delete(viewer, saved.getId())).isInstanceOf(ApiException.class);
    }
}
