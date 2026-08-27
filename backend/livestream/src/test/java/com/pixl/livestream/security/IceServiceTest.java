package com.pixl.livestream.security;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

import com.pixl.livestream.media.IceService;
import com.pixl.livestream.config.LivestreamProperties;

class IceServiceTest {

    @Test
    void mintsTimeLimitedTurnCredentials() {
        LivestreamProperties properties = new LivestreamProperties();
        properties.getIce().setStunUrls("stun:turn.pixl.local:3478");
        properties.getIce().setTurnServer("turn.pixl.local");
        properties.getIce().setTurnSecret("super-secret");
        properties.getIce().setTurnUdpPort(3478);
        properties.getIce().setTurnTcpPort(3478);
        properties.getIce().setTurnTlsPort(5349);
        IceService ice = new IceService(properties);
        var servers = ice.iceServers("user-9");
        assertThat(servers).hasSize(2);
        assertThat(servers.get(1).urls()).anyMatch(u -> u.startsWith("turn:"));
        assertThat(servers.get(1).urls()).anyMatch(u -> u.startsWith("turns:"));
        assertThat(servers.get(1).username()).contains(":user-9");
        assertThat(servers.get(1).credential()).isNotBlank();
    }
}
