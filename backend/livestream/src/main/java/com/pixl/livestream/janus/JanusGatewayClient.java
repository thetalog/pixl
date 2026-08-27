package com.pixl.livestream.janus;

import java.time.Duration;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.function.Consumer;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.pixl.livestream.common.ApiException;
import com.pixl.livestream.config.LivestreamProperties;

import jakarta.annotation.PreDestroy;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
@ConditionalOnProperty(name = "livestream.janus.enabled", havingValue = "true", matchIfMissing = true)
public class JanusGatewayClient {

    private final RestClient http;
    private final ObjectMapper mapper;
    private final LivestreamProperties properties;
    private final ExecutorService pollers = Executors.newVirtualThreadPerTaskExecutor();
    private final Map<Long, Consumer<JsonNode>> listeners = new ConcurrentHashMap<>();
    private final Map<Long, Boolean> running = new ConcurrentHashMap<>();

    public JanusGatewayClient(RestClient.Builder builder, ObjectMapper mapper, LivestreamProperties properties) {
        this.mapper = mapper;
        this.properties = properties;
        this.http = builder
                .baseUrl(properties.getJanus().getHttpUrl() == null ? "http://localhost:8088/janus" : properties.getJanus().getHttpUrl())
                .build();
    }

    public long createSession() {
        JsonNode response = post("", Map.of("janus", "create", "transaction", txn()));
        return response.path("data").path("id").asLong();
    }

    public long attachVideoRoom(long sessionId) {
        JsonNode response = post("/" + sessionId, Map.of(
                "janus", "attach",
                "plugin", "janus.plugin.videoroom",
                "transaction", txn()
        ));
        return response.path("data").path("id").asLong();
    }

    public JsonNode sendMessage(long sessionId, long handleId, Map<String, Object> body, Map<String, Object> jsep) {
        ObjectNode payload = mapper.createObjectNode();
        payload.put("janus", "message");
        payload.put("transaction", txn());
        payload.set("body", mapper.valueToTree(body));
        if (jsep != null) {
            payload.set("jsep", mapper.valueToTree(jsep));
        }
        return post("/" + sessionId + "/" + handleId, payload);
    }

    public void trickle(long sessionId, long handleId, Map<String, Object> candidate) {
        ObjectNode payload = mapper.createObjectNode();
        payload.put("janus", "trickle");
        payload.put("transaction", txn());
        payload.set("candidate", mapper.valueToTree(candidate));
        post("/" + sessionId + "/" + handleId, payload);
    }

    public void destroySession(long sessionId) {
        running.put(sessionId, false);
        listeners.remove(sessionId);
        try {
            post("/" + sessionId, Map.of("janus", "destroy", "transaction", txn()));
        } catch (Exception ex) {
            log.debug("Janus session destroy failed {}: {}", sessionId, ex.getMessage());
        }
    }

    public void startPolling(long sessionId, Consumer<JsonNode> listener) {
        listeners.put(sessionId, listener);
        running.put(sessionId, true);
        pollers.submit(() -> {
            while (Boolean.TRUE.equals(running.get(sessionId))) {
                try {
                    JsonNode events = http.get()
                            .uri("/{session}?maxev=10&rid={rid}", sessionId, UUID.randomUUID())
                            .retrieve()
                            .body(JsonNode.class);
                    if (events == null || events.isNull()) {
                        continue;
                    }
                    Consumer<JsonNode> current = listeners.get(sessionId);
                    if (current == null) {
                        continue;
                    }
                    if (events.isArray()) {
                        events.forEach(current);
                    } else {
                        current.accept(events);
                    }
                } catch (Exception ex) {
                    if (Boolean.TRUE.equals(running.get(sessionId))) {
                        log.debug("Janus poll error session {}: {}", sessionId, ex.getMessage());
                        try {
                            Thread.sleep(250);
                        } catch (InterruptedException interrupted) {
                            Thread.currentThread().interrupt();
                            return;
                        }
                    }
                }
            }
        });
    }

    public CompletableFuture<JsonNode> waitFor(long sessionId, String pluginEvent, Duration timeout) {
        CompletableFuture<JsonNode> future = new CompletableFuture<>();
        Consumer<JsonNode> previous = listeners.get(sessionId);
        listeners.put(sessionId, event -> {
            if (previous != null) {
                previous.accept(event);
            }
            JsonNode plugindata = event.path("plugindata").path("data");
            if (pluginEvent.equals(plugindata.path("videoroom").asText())
                    || pluginEvent.equals(event.path("janus").asText())) {
                if (!future.isDone()) {
                    future.complete(event);
                }
            }
            if (event.has("jsep") && "jsep".equals(pluginEvent) && !future.isDone()) {
                future.complete(event);
            }
        });
        return future.orTimeout(timeout.toMillis(), java.util.concurrent.TimeUnit.MILLISECONDS);
    }

    public boolean ping() {
        try {
            JsonNode info = http.get().uri("/info").retrieve().body(JsonNode.class);
            return info != null && "server_info".equals(info.path("janus").asText());
        } catch (Exception ex) {
            log.warn("Janus unavailable: {}", ex.getMessage());
            return false;
        }
    }

    @PreDestroy
    public void shutdown() {
        running.replaceAll((id, v) -> false);
        pollers.shutdownNow();
    }

    private JsonNode post(String path, Object body) {
        try {
            JsonNode response = http.post()
                    .uri(path)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(body)
                    .retrieve()
                    .body(JsonNode.class);
            if (response != null && "error".equals(response.path("janus").asText())) {
                throw ApiException.unavailable("Janus error: " + response.path("error").path("reason").asText());
            }
            return response;
        } catch (ApiException ex) {
            throw ex;
        } catch (Exception ex) {
            throw ApiException.unavailable("Janus request failed: " + ex.getMessage());
        }
    }

    private String txn() {
        return UUID.randomUUID().toString().replace("-", "").substring(0, 16);
    }
}
