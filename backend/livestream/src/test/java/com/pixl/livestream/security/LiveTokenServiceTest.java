package com.pixl.livestream.security;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.time.Instant;
import java.util.List;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import com.pixl.livestream.common.ApiException;

@SpringBootTest
@ActiveProfiles("test")
class LiveTokenServiceTest {

    @Autowired
    LiveTokenService tokens;

    @Test
    void roundTripToken() {
        LivePrincipal principal = new LivePrincipal(
                "user-1", "a@b.com", "alice", "Alice", "", "stream-1", "pixl-1",
                LiveRole.HOST, RolePermissions.forRole(LiveRole.HOST)
        );
        String jwt = tokens.issue(principal, Instant.now().plusSeconds(60));
        LivePrincipal parsed = tokens.parse(jwt);
        assertThat(parsed.userId()).isEqualTo("user-1");
        assertThat(parsed.role()).isEqualTo(LiveRole.HOST);
        assertThat(parsed.has(LivePermission.PUBLISH)).isTrue();
        assertThat(parsed.streamId()).isEqualTo("stream-1");
    }

    @Test
    void rejectsGarbage() {
        assertThatThrownBy(() -> tokens.parse("not-a-token")).isInstanceOf(ApiException.class);
    }

    @Test
    void viewerCannotPublish() {
        List<LivePermission> perms = RolePermissions.forRole(LiveRole.VIEWER);
        assertThat(perms).contains(LivePermission.JOIN_STREAM, LivePermission.COMMENT);
        assertThat(perms).doesNotContain(LivePermission.PUBLISH, LivePermission.END_STREAM);
    }
}
