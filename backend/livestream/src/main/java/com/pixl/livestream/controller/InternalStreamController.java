package com.pixl.livestream.controller;

import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.pixl.livestream.dto.StreamDtos.CreateStreamRequest;
import com.pixl.livestream.dto.StreamDtos.CreateStreamResponse;
import com.pixl.livestream.dto.StreamDtos.JoinStreamRequest;
import com.pixl.livestream.dto.StreamDtos.SessionPayload;
import com.pixl.livestream.dto.StreamDtos.ForceEndRequest;
import com.pixl.livestream.dto.StreamDtos.StartStreamRequest;
import com.pixl.livestream.dto.StreamDtos.StreamView;
import com.pixl.livestream.dto.StreamDtos.ViewerView;
import com.pixl.livestream.entity.LivestreamEntity;
import com.pixl.livestream.media.IceService;
import com.pixl.livestream.repository.LivestreamRepository;
import com.pixl.livestream.security.LiveRole;
import com.pixl.livestream.stream.StreamService;
import com.pixl.livestream.viewer.ViewerService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/internal/v1/streams")
@Tag(name = "Internal streams", description = "Called by the Pixl Node.js backend only")
public class InternalStreamController {

    private final StreamService streams;
    private final ViewerService viewers;
    private final IceService iceService;
    private final LivestreamRepository repository;

    public InternalStreamController(
            StreamService streams,
            ViewerService viewers,
            IceService iceService,
            LivestreamRepository repository
    ) {
        this.streams = streams;
        this.viewers = viewers;
        this.iceService = iceService;
        this.repository = repository;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Create a livestream session")
    public CreateStreamResponse create(@Valid @RequestBody CreateStreamRequest request) {
        return streams.create(request);
    }

    @PostMapping("/{streamId}/start")
    public StreamView start(@PathVariable String streamId, @RequestBody(required = false) StartStreamRequest request) {
        LivestreamEntity entity = resolve(streamId);
        String actor = request == null || request.actorUserId() == null ? entity.getHostUserId() : request.actorUserId();
        return streams.start(entity.getId(), actor);
    }

    @PostMapping("/{streamId}/end")
    public StreamView end(@PathVariable String streamId, @RequestBody(required = false) StartStreamRequest request) {
        LivestreamEntity entity = resolve(streamId);
        String actor = request == null || request.actorUserId() == null ? entity.getHostUserId() : request.actorUserId();
        return streams.end(entity.getId(), actor);
    }

    @PostMapping("/{streamId}/force-end")
    @Operation(summary = "Platform-moderator terminate; bypasses host-only check")
    public StreamView forceEnd(@PathVariable String streamId, @RequestBody(required = false) ForceEndRequest request) {
        LivestreamEntity entity = resolve(streamId);
        String actor = request == null || request.actorUserId() == null || request.actorUserId().isBlank()
                ? "platform"
                : request.actorUserId();
        String reason = request == null || request.reason() == null || request.reason().isBlank()
                ? "platform_moderation"
                : request.reason();
        return streams.forceEnd(entity, actor, reason);
    }

    @GetMapping("/{streamId}")
    public StreamView get(@PathVariable String streamId) {
        return streams.toView(resolve(streamId));
    }

    @PostMapping("/{streamId}/join")
    public SessionPayload join(@PathVariable String streamId, @Valid @RequestBody JoinStreamRequest request) {
        LivestreamEntity entity = resolve(streamId);
        return streams.joinSession(
                entity.getId(),
                request.userId(),
                request.userName(),
                request.displayName(),
                request.avatarUrl(),
                request.role() == null ? LiveRole.VIEWER : request.role()
        );
    }

    @PostMapping("/{streamId}/leave")
    public Map<String, Object> leave(@PathVariable String streamId) {
        return Map.of("left", true, "streamId", resolve(streamId).getId().toString());
    }

    @GetMapping("/{streamId}/viewers")
    public List<ViewerView> viewers(@PathVariable String streamId) {
        return viewers.viewers(resolve(streamId).getId());
    }

    @GetMapping("/{streamId}/ice")
    public Map<String, Object> ice(@PathVariable String streamId) {
        LivestreamEntity stream = resolve(streamId);
        return Map.of(
                "streamId", stream.getId().toString(),
                "iceServers", iceService.iceServers(stream.getHostUserId())
        );
    }

    @GetMapping
    public List<StreamView> live() {
        return streams.listLive();
    }

    private LivestreamEntity resolve(String streamId) {
        try {
            return streams.require(UUID.fromString(streamId));
        } catch (IllegalArgumentException ex) {
            return repository.findByPixlStreamId(streamId)
                    .orElseThrow(() -> com.pixl.livestream.common.ApiException.notFound("Stream not found"));
        }
    }
}
