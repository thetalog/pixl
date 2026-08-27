package com.pixl.livestream.media;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Base64;
import java.util.List;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;

import org.springframework.stereotype.Service;

import com.pixl.livestream.config.LivestreamProperties;
import com.pixl.livestream.dto.StreamDtos.IceServer;

@Service
public class IceService {

    private final LivestreamProperties properties;

    public IceService(LivestreamProperties properties) {
        this.properties = properties;
    }

    public List<IceServer> iceServers(String userId) {
        LivestreamProperties.Ice ice = properties.getIce();
        List<IceServer> servers = new ArrayList<>();
        String stun = ice.getStunUrls();
        if (stun != null && !stun.isBlank()) {
            servers.add(new IceServer(List.of(browserHost(stun)), null, null));
        }

        String host = browserHost(ice.getTurnServer());
        if (host == null || host.isBlank()) {
            return servers;
        }

        String username;
        String credential;
        if (ice.getTurnUsername() != null && !ice.getTurnUsername().isBlank()
                && ice.getTurnPassword() != null && !ice.getTurnPassword().isBlank()) {
            username = ice.getTurnUsername();
            credential = ice.getTurnPassword();
        } else {
            long expiry = Instant.now().getEpochSecond() + ice.getTurnTtlSeconds();
            username = expiry + ":" + (userId == null || userId.isBlank() ? "anon" : userId);
            credential = hmac(ice.getTurnSecret(), username);
        }

        String udp = "turn:" + host + ":" + ice.getTurnUdpPort() + "?transport=udp";
        String tcp = "turn:" + host + ":" + ice.getTurnTcpPort() + "?transport=tcp";
        String tls = "turns:" + host + ":" + ice.getTurnTlsPort() + "?transport=tcp";
        servers.add(new IceServer(List.of(udp, tcp, tls), username, credential));
        return servers;
    }

    static String browserHost(String value) {
        if (value == null || value.isBlank()) {
            return value;
        }
        return value.replace("localhost", "127.0.0.1").replace("LOCALHOST", "127.0.0.1");
    }

    static String hmac(String secret, String username) {
        try {
            Mac mac = Mac.getInstance("HmacSHA1");
            mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA1"));
            return Base64.getEncoder().encodeToString(mac.doFinal(username.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception ex) {
            throw new IllegalStateException("Unable to mint TURN credentials", ex);
        }
    }
}
