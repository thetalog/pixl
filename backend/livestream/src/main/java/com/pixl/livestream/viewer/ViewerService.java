package com.pixl.livestream.viewer;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import com.pixl.livestream.common.ApiException;
import com.pixl.livestream.config.LivestreamProperties;
import com.pixl.livestream.dto.StreamDtos.ViewerView;
import com.pixl.livestream.entity.LivestreamEntity;
import com.pixl.livestream.repository.LivestreamRepository;
import com.pixl.livestream.security.LivePrincipal;
import com.pixl.livestream.stream.StreamService;
import com.pixl.livestream.stream.StreamStatus;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
public class ViewerService {

    private final PresenceStore presence;
    private final LivestreamProperties properties;
    private final LivestreamRepository streams;
    private final StreamService streamService;

    public ViewerService(
            PresenceStore presence,
            LivestreamProperties properties,
            LivestreamRepository streams,
            StreamService streamService
    ) {
        this.presence = presence;
        this.properties = properties;
        this.streams = streams;
        this.streamService = streamService;
    }

    public ViewerPresence join(LivePrincipal principal, String connectionId) {
        String streamId = principal.streamId();
        long already = presence.list(streamId).stream().filter(v -> v.viewerId().equals(principal.userId())).count();
        if (already >= properties.getLimits().getMaxConnectionsPerUser()) {
            throw ApiException.tooMany("Too many connections for this user");
        }
        Instant now = Instant.now();
        ViewerPresence record = new ViewerPresence(
                streamId, principal.userId(), principal.userName(), connectionId, now, now
        );
        presence.put(record);
        if (principal.isHost()) {
            presence.setHostConnection(streamId, connectionId);
            presence.clearHostDisconnect(streamId);
        }
        bumpPeak(streamId);
        log.info("viewer_joined streamId={} userId={} connectionId={}", streamId, principal.userId(), connectionId);
        return record;
    }

    public void leave(String streamId, String connectionId, boolean host) {
        presence.remove(streamId, connectionId);
        log.info("viewer_left streamId={} connectionId={}", streamId, connectionId);
        if (host) {
            Instant deadline = Instant.now().plusSeconds(properties.getPresence().getHostReconnectWindowSeconds());
            presence.markHostDisconnect(streamId, deadline);
            log.info("host_disconnected streamId={} reconnectUntil={}", streamId, deadline);
        }
    }

    public void heartbeat(String streamId, String connectionId) {
        presence.heartbeat(streamId, connectionId);
    }

    public List<ViewerView> viewers(UUID streamId) {
        return presence.list(streamId.toString()).stream()
                .map(v -> new ViewerView(v.viewerId(), v.userName(), v.connectionId(), v.joinedAt().toString()))
                .toList();
    }

    public int count(UUID streamId) {
        return presence.count(streamId.toString());
    }

    @Scheduled(fixedDelay = 5000)
    public void reap() {
        Duration timeout = Duration.ofSeconds(properties.getPresence().getTimeoutSeconds());
        streams.findByStatusOrderByStartedAtDesc(StreamStatus.LIVE).forEach(stream -> {
            String streamId = stream.getId().toString();
            for (ViewerPresence expired : presence.expired(streamId, timeout)) {
                presence.remove(streamId, expired.connectionId());
                log.info("viewer_timeout streamId={} userId={}", streamId, expired.viewerId());
            }
            presence.hostReconnectDeadline(streamId).ifPresent(deadline -> {
                if (Instant.now().isAfter(deadline)) {
                    log.info("host reconnect window expired streamId={}", streamId);
                    streamService.forceEnd(stream, stream.getHostUserId(), "host_timeout");
                    presence.clearHostDisconnect(streamId);
                }
            });
        });
    }

    private void bumpPeak(String streamId) {
        try {
            LivestreamEntity entity = streams.findById(UUID.fromString(streamId)).orElse(null);
            if (entity == null) {
                return;
            }
            int count = presence.count(streamId);
            if (count > entity.getPeakViewerCount()) {
                entity.setPeakViewerCount(count);
                streams.save(entity);
            }
        } catch (Exception ignored) {
            // ignore
        }
    }
}
