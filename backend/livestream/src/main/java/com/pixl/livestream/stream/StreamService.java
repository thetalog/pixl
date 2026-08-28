package com.pixl.livestream.stream;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.pixl.livestream.common.ApiException;
import com.pixl.livestream.config.LivestreamProperties;
import com.pixl.livestream.dto.StreamDtos;
import com.pixl.livestream.dto.StreamDtos.CreateStreamRequest;
import com.pixl.livestream.dto.StreamDtos.CreateStreamResponse;
import com.pixl.livestream.dto.StreamDtos.SessionPayload;
import com.pixl.livestream.dto.StreamDtos.StreamView;
import com.pixl.livestream.entity.LivestreamEntity;
import com.pixl.livestream.media.IceService;
import com.pixl.livestream.media.MediaRouter;
import com.pixl.livestream.recording.RecordingService;
import com.pixl.livestream.repository.LivestreamModeratorRepository;
import com.pixl.livestream.repository.LivestreamRepository;
import com.pixl.livestream.security.LivePermission;
import com.pixl.livestream.security.LivePrincipal;
import com.pixl.livestream.security.LiveRole;
import com.pixl.livestream.security.LiveTokenService;
import com.pixl.livestream.security.RolePermissions;
import com.pixl.livestream.viewer.PresenceStore;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
public class StreamService {

    private final LivestreamRepository streams;
    private final LivestreamModeratorRepository moderators;
    private final MediaRouter mediaRouter;
    private final IceService iceService;
    private final LiveTokenService tokens;
    private final LivestreamProperties properties;
    private final PresenceStore presence;
    private final StreamEventLogger events;
    private final RecordingService recordings;
    private final com.pixl.livestream.integration.NodeCallbackClient node;

    public StreamService(
            LivestreamRepository streams,
            LivestreamModeratorRepository moderators,
            MediaRouter mediaRouter,
            IceService iceService,
            LiveTokenService tokens,
            LivestreamProperties properties,
            PresenceStore presence,
            StreamEventLogger events,
            RecordingService recordings,
            com.pixl.livestream.integration.NodeCallbackClient node
    ) {
        this.streams = streams;
        this.moderators = moderators;
        this.mediaRouter = mediaRouter;
        this.iceService = iceService;
        this.tokens = tokens;
        this.properties = properties;
        this.presence = presence;
        this.events = events;
        this.recordings = recordings;
        this.node = node;
    }

    private static final List<StreamStatus> ACTIVE_STATUSES = List.of(
            StreamStatus.CREATED,
            StreamStatus.STARTING,
            StreamStatus.LIVE
    );

    private static boolean isActive(LivestreamEntity entity) {
        return entity != null && ACTIVE_STATUSES.contains(entity.getStatus());
    }

    @Transactional
    public CreateStreamResponse create(CreateStreamRequest request) {
        var byPixl = streams.findByPixlStreamId(request.pixlStreamId());
        if (byPixl.isPresent() && isActive(byPixl.get())) {
            return resume(byPixl.get(), request);
        }
        if (byPixl.isPresent()) {
            throw ApiException.conflict("Stream already exists");
        }
        List<LivestreamEntity> liveAlready = streams.findByHostUserIdAndStatusIn(
                request.hostUserId(),
                ACTIVE_STATUSES
        );
        if (!liveAlready.isEmpty()) {
            return resume(liveAlready.get(0), request);
        }

        LivestreamEntity entity = new LivestreamEntity();
        entity.setId(UUID.randomUUID());
        entity.setPixlStreamId(request.pixlStreamId());
        entity.setHostUserId(request.hostUserId());
        entity.setHostUsername(request.hostUsername());
        entity.setHostDisplayName(request.hostDisplayName());
        entity.setHostAvatarUrl(request.hostAvatarUrl());
        entity.setTitle(request.title());
        entity.setStatus(StreamStatus.CREATED);
        entity.setVisibility(parseVisibility(request.visibility()));
        entity.setRecordingEnabled(Boolean.TRUE.equals(request.recordingEnabled()));
        entity.setCreatedAt(Instant.now());
        entity.setLikeCount(0);
        entity.setReactionCount(0);
        entity.setPeakViewerCount(0);

        try {
            long roomId = mediaRouter.createRoom(entity.getId().toString(), entity.isRecordingEnabled());
            entity.setJanusRoomId(roomId);
        } catch (Exception ex) {
            log.error("media room create failed pixlStreamId={}", request.pixlStreamId(), ex);
            entity.setStatus(StreamStatus.FAILED);
            entity.setFailureReason(ex.getMessage());
            streams.save(entity);
            events.log(entity.getId(), "stream_failed", request.hostUserId(), ex.getMessage());
            throw ApiException.unavailable("Media layer unavailable");
        }

        streams.save(entity);
        events.log(entity.getId(), "stream_created", request.hostUserId(), entity.getTitle());
        log.info("stream created id={} pixlStreamId={} host={}", entity.getId(), entity.getPixlStreamId(), entity.getHostUserId());

        LivePrincipal principal = hostPrincipal(entity);
        return new CreateStreamResponse(toView(entity), sessionFor(principal));
    }

    private CreateStreamResponse resume(LivestreamEntity existing, CreateStreamRequest request) {
        if (request.pixlStreamId() != null && !request.pixlStreamId().equals(existing.getPixlStreamId())) {
            existing.setPixlStreamId(request.pixlStreamId());
        }
        if (request.title() != null && !request.title().isBlank()) {
            existing.setTitle(request.title());
        }
        ensureMediaRoom(existing);
        log.info("stream resumed id={} pixlStreamId={} host={} room={}",
                existing.getId(), existing.getPixlStreamId(), existing.getHostUserId(), existing.getJanusRoomId());
        return new CreateStreamResponse(toView(existing), sessionFor(hostPrincipal(existing)));
    }

    @Transactional
    public LivestreamEntity ensureMediaRoom(LivestreamEntity entity) {
        Long roomId = entity.getJanusRoomId();
        if (roomId != null && mediaRouter.roomExists(roomId)) {
            return entity;
        }
        try {
            if (roomId != null) {
                mediaRouter.destroyRoom(roomId);
            }
        } catch (Exception ex) {
            log.debug("destroy stale janus room {} failed: {}", roomId, ex.getMessage());
        }
        long created = mediaRouter.createRoom(entity.getId().toString(), entity.isRecordingEnabled());
        entity.setJanusRoomId(created);
        entity.setPublisherFeedId(null);
        if (entity.getStatus() == StreamStatus.LIVE || entity.getStatus() == StreamStatus.STARTING) {
            entity.setStatus(StreamStatus.CREATED);
        }
        streams.save(entity);
        log.info("janus room recreated streamId={} room={}", entity.getId(), created);
        return entity;
    }

    @Transactional
    public StreamView start(UUID streamId, String actorUserId) {
        LivestreamEntity entity = require(streamId);
        if (!entity.getHostUserId().equals(actorUserId)) {
            throw ApiException.forbidden("Only the host can start this stream");
        }
        if (entity.getStatus() == StreamStatus.LIVE) {
            return toView(entity);
        }
        if (entity.getStatus() == StreamStatus.ENDED || entity.getStatus() == StreamStatus.FAILED) {
            throw ApiException.conflict("Stream can no longer be started");
        }
        entity.setStatus(StreamStatus.STARTING);
        streams.save(entity);
        events.log(entity.getId(), "stream_starting", actorUserId, null);
        return toView(entity);
    }

    @Transactional
    public StreamView markLive(UUID streamId, Long publisherFeedId) {
        LivestreamEntity entity = require(streamId);
        entity.setStatus(StreamStatus.LIVE);
        entity.setStartedAt(Instant.now());
        if (publisherFeedId != null) {
            entity.setPublisherFeedId(publisherFeedId);
        }
        if (entity.isRecordingEnabled()) {
            recordings.start(entity.getId());
        }
        streams.save(entity);
        events.log(entity.getId(), "stream_started", entity.getHostUserId(), null);
        log.info("stream started id={} feed={}", entity.getId(), publisherFeedId);
        node.notifyStatus(entity.getPixlStreamId(), StreamStatus.LIVE.name(), presence.count(entity.getId().toString()), entity.getLikeCount());
        return toView(entity);
    }

    @Transactional
    public StreamView end(UUID streamId, String actorUserId) {
        LivestreamEntity entity = require(streamId);
        if (!entity.getHostUserId().equals(actorUserId)) {
            throw ApiException.forbidden("Only the host can end this stream");
        }
        return forceEnd(entity, actorUserId, "host_end");
    }

    @Transactional
    public StreamView forceEnd(LivestreamEntity entity, String actorUserId, String reason) {
        if (entity.getStatus() == StreamStatus.ENDED) {
            return toView(entity);
        }
        entity.setStatus(StreamStatus.ENDING);
        streams.save(entity);
        if (entity.getJanusRoomId() != null) {
            mediaRouter.destroyRoom(entity.getJanusRoomId());
        }
        if (entity.isRecordingEnabled()) {
            recordings.complete(entity.getId());
        }
        entity.setStatus(StreamStatus.ENDED);
        entity.setEndedAt(Instant.now());
        entity.setFailureReason(reason);
        streams.save(entity);
        events.log(entity.getId(), "stream_ended", actorUserId, reason);
        log.info("stream ended id={} reason={}", entity.getId(), reason);
        node.notifyStatus(entity.getPixlStreamId(), StreamStatus.ENDED.name(), 0, entity.getLikeCount());
        presence.publish("live:events:" + entity.getId(), "{\"type\":\"STREAM_ENDED\",\"streamId\":\"" + entity.getId() + "\"}");
        return toView(entity);
    }

    public StreamView get(UUID streamId) {
        return toView(require(streamId));
    }

    public StreamView getByPixlId(String pixlStreamId) {
        return toView(streams.findByPixlStreamId(pixlStreamId).orElseThrow(() -> ApiException.notFound("Stream not found")));
    }

    public List<StreamView> listLive() {
        Instant cutoff = Instant.now().minus(Duration.ofHours(24));
        return streams.findByStatusInOrderByCreatedAtDesc(ACTIVE_STATUSES).stream()
                .filter(entity -> entity.getCreatedAt() == null || !entity.getCreatedAt().isBefore(cutoff))
                .map(this::toView)
                .toList();
    }

    public LivestreamEntity require(UUID streamId) {
        return streams.findById(streamId).orElseThrow(() -> ApiException.notFound("Stream not found"));
    }

    public SessionPayload joinSession(UUID streamId, String userId, String userName, String displayName, String avatarUrl, LiveRole requestedRole) {
        LivestreamEntity entity = require(streamId);
        if (entity.getStatus() == StreamStatus.ENDED || entity.getStatus() == StreamStatus.FAILED) {
            throw ApiException.conflict("Stream is not joinable");
        }
        if (presence.count(streamId.toString()) >= properties.getLimits().getMaxViewersPerStream()
                && !entity.getHostUserId().equals(userId)) {
            throw ApiException.tooMany("Viewer limit reached");
        }
        LiveRole role = resolveRole(entity, userId, requestedRole);
        LivePrincipal principal = new LivePrincipal(
                userId, "", userName, displayName, avatarUrl,
                entity.getId().toString(), entity.getPixlStreamId(), role, RolePermissions.forRole(role)
        );
        return sessionFor(principal);
    }

    public SessionPayload sessionFor(LivePrincipal principal) {
        Instant exp = Instant.now().plus(Duration.ofHours(2));
        return new SessionPayload(
                tokens.issue(principal, exp),
                properties.getSignalingUrl(),
                principal.streamId(),
                principal.pixlStreamId(),
                principal.role(),
                principal.permissions(),
                iceService.iceServers(principal.userId())
        );
    }

    public LivePrincipal hostPrincipal(LivestreamEntity entity) {
        return new LivePrincipal(
                entity.getHostUserId(),
                "",
                entity.getHostUsername(),
                entity.getHostDisplayName(),
                entity.getHostAvatarUrl(),
                entity.getId().toString(),
                entity.getPixlStreamId(),
                LiveRole.HOST,
                RolePermissions.forRole(LiveRole.HOST)
        );
    }

    public void assertPermission(LivePrincipal principal, LivePermission permission) {
        if (principal == null || !principal.has(permission)) {
            throw ApiException.forbidden("Missing permission " + permission);
        }
    }

    public StreamView toView(LivestreamEntity entity) {
        return new StreamView(
                entity.getId().toString(),
                entity.getPixlStreamId(),
                entity.getHostUserId(),
                entity.getHostUsername(),
                entity.getHostDisplayName(),
                entity.getHostAvatarUrl(),
                entity.getTitle(),
                entity.getStatus().name(),
                entity.getVisibility().name(),
                entity.isRecordingEnabled(),
                presence.count(entity.getId().toString()),
                entity.getLikeCount() + presence.getReaction(entity.getId().toString(), "LIKE"),
                entity.getCreatedAt() == null ? null : entity.getCreatedAt().toString(),
                entity.getStartedAt() == null ? null : entity.getStartedAt().toString(),
                entity.getEndedAt() == null ? null : entity.getEndedAt().toString(),
                properties.getSignalingUrl()
        );
    }

    @Transactional
    public void addLikes(UUID streamId, long amount) {
        LivestreamEntity entity = require(streamId);
        entity.setLikeCount(entity.getLikeCount() + amount);
        streams.save(entity);
    }

    private LiveRole resolveRole(LivestreamEntity entity, String userId, LiveRole requested) {
        if (entity.getHostUserId().equals(userId)) {
            return LiveRole.HOST;
        }
        if (moderators.findByStreamIdAndUserId(entity.getId(), userId).isPresent()) {
            return LiveRole.MODERATOR;
        }
        if (requested == LiveRole.ADMIN || requested == LiveRole.HOST) {
            return LiveRole.VIEWER;
        }
        return requested == null ? LiveRole.VIEWER : requested;
    }

    private StreamVisibility parseVisibility(String raw) {
        if (raw == null || raw.isBlank()) {
            return StreamVisibility.PUBLIC;
        }
        try {
            return StreamVisibility.valueOf(raw.toUpperCase());
        } catch (IllegalArgumentException ex) {
            return StreamVisibility.PUBLIC;
        }
    }
}
