package com.pixl.livestream.config;

import java.util.List;

import org.springframework.boot.context.properties.ConfigurationProperties;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@ConfigurationProperties(prefix = "livestream")
public class LivestreamProperties {

    private String internalSecret;
    private String publicBaseUrl;
    private String wsPath = "/ws/live";
    private String signalingUrl;
    private Jwt jwt = new Jwt();
    private Cors cors = new Cors();
    private Node node = new Node();
    private Janus janus = new Janus();
    private Ice ice = new Ice();
    private Presence presence = new Presence();
    private Chat chat = new Chat();
    private Limits limits = new Limits();
    private Recording recording = new Recording();

    @Getter
    @Setter
    public static class Jwt {
        private String secret;
        private String issuer = "pixl-node";
        private String audience = "pixl-livestream";
    }

    @Getter
    @Setter
    public static class Cors {
        private List<String> allowedOrigins = List.of("http://localhost:3000");
    }

    @Getter
    @Setter
    public static class Node {
        private String baseUrl;
        private String callbackSecret;
        private boolean callbacksEnabled = true;
    }

    @Getter
    @Setter
    public static class Janus {
        private boolean enabled = true;
        private String httpUrl;
        private String adminUrl;
        private String adminSecret;
        private long bitrateBps = 1_200_000;
        private long timeoutMs = 20000;
    }

    @Getter
    @Setter
    public static class Ice {
        private String stunUrls;
        private String turnServer;
        private int turnUdpPort = 3478;
        private int turnTcpPort = 3478;
        private int turnTlsPort = 5349;
        private String turnSecret;
        private String turnRealm = "pixl.local";
        private long turnTtlSeconds = 3600;
        private String turnUsername;
        private String turnPassword;
    }

    @Getter
    @Setter
    public static class Presence {
        private int heartbeatSeconds = 20;
        private int timeoutSeconds = 60;
        private int hostReconnectWindowSeconds = 45;
    }

    @Getter
    @Setter
    public static class Chat {
        private int maxLength = 280;
        private int ratePerMinute = 20;
    }

    @Getter
    @Setter
    public static class Limits {
        private int maxViewersPerStream = 5000;
        private int maxConnectionsPerUser = 4;
        private int maxWsMessageBytes = 32768;
    }

    @Getter
    @Setter
    public static class Recording {
        private boolean enabledDefault = false;
        private String storage = "local";
        private String localPath = "/var/pixl/recordings";
        private String s3Endpoint;
        private String s3Bucket;
        private String s3AccessKey;
        private String s3SecretKey;
        private String s3Region = "us-east-1";
    }
}
