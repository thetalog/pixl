package com.pixl.livestream.viewer;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import com.pixl.livestream.dto.StreamDtos.CreateStreamRequest;
import com.pixl.livestream.security.LivePrincipal;
import com.pixl.livestream.security.LiveRole;
import com.pixl.livestream.security.RolePermissions;
import com.pixl.livestream.stream.StreamService;

@SpringBootTest
@ActiveProfiles("test")
class ConcurrentViewerTest {

    @Autowired
    ViewerService viewers;

    @Autowired
    StreamService streams;

    @Test
    void manyViewersTrackedAuthoritatively() {
        var created = streams.create(new CreateStreamRequest(
                "pixl-view-" + System.nanoTime(), "host-v", "host", "Host", null, "Busy", "PUBLIC", false
        ));
        String streamId = created.stream().streamId();
        for (int i = 0; i < 25; i++) {
            LivePrincipal principal = new LivePrincipal(
                    "u" + i, "", "user" + i, "User", "", streamId, created.stream().pixlStreamId(),
                    LiveRole.VIEWER, RolePermissions.forRole(LiveRole.VIEWER)
            );
            viewers.join(principal, "conn-" + i);
        }
        assertThat(viewers.count(java.util.UUID.fromString(streamId))).isEqualTo(25);
        viewers.leave(streamId, "conn-0", false);
        assertThat(viewers.count(java.util.UUID.fromString(streamId))).isEqualTo(24);
    }
}
