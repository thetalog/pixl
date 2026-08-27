package com.pixl.livestream.integration;

import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import com.pixl.livestream.config.LivestreamProperties;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
public class NodeCallbackClient {

    private final RestClient http;
    private final LivestreamProperties properties;

    public NodeCallbackClient(RestClient.Builder builder, LivestreamProperties properties) {
        this.properties = properties;
        String base = properties.getNode().getBaseUrl() == null ? "http://localhost:3001" : properties.getNode().getBaseUrl();
        this.http = builder.baseUrl(base).build();
    }

    public void notifyStatus(String pixlStreamId, String status, int viewerCount, long likeCount) {
        post(pixlStreamId, "/status", java.util.Map.of(
                "status", status,
                "viewerCount", viewerCount,
                "likeCount", likeCount
        ));
    }

    public void notifyComment(String pixlStreamId, java.util.Map<String, Object> comment) {
        post(pixlStreamId, "/comment", comment);
    }

    private void post(String pixlStreamId, String suffix, Object body) {
        if (!properties.getNode().isCallbacksEnabled()) {
            return;
        }
        if (pixlStreamId == null || pixlStreamId.isBlank()) {
            return;
        }
        String path = "/internal/live/" + java.net.URLEncoder.encode(pixlStreamId, java.nio.charset.StandardCharsets.UTF_8) + suffix;
        try {
            http.post()
                    .uri(path)
                    .contentType(MediaType.APPLICATION_JSON)
                    .header("X-Internal-Secret", properties.getNode().getCallbackSecret())
                    .body(body)
                    .retrieve()
                    .toBodilessEntity();
        } catch (Exception ex) {
            log.warn("Node callback failed path={} err={}", path, ex.getMessage());
        }
    }
}
