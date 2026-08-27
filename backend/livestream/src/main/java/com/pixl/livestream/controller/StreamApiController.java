package com.pixl.livestream.controller;

import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.pixl.livestream.dto.StreamDtos.StreamView;
import com.pixl.livestream.dto.StreamDtos.ViewerView;
import com.pixl.livestream.media.IceService;
import com.pixl.livestream.security.LiveJwtFilter;
import com.pixl.livestream.security.LivePrincipal;
import com.pixl.livestream.stream.StreamService;
import com.pixl.livestream.viewer.ViewerService;

import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;

@RestController
@RequestMapping("/api/v1/streams")
@Tag(name = "Client streams")
@SecurityRequirement(name = "liveToken")
public class StreamApiController {

    private final StreamService streams;
    private final ViewerService viewers;
    private final IceService iceService;

    public StreamApiController(StreamService streams, ViewerService viewers, IceService iceService) {
        this.streams = streams;
        this.viewers = viewers;
        this.iceService = iceService;
    }

    @GetMapping("/{streamId}")
    public StreamView get(@PathVariable UUID streamId, HttpServletRequest request) {
        LivePrincipal principal = principal(request);
        if (!principal.streamId().equals(streamId.toString()) && !principal.isHost()) {
            // still allow read of the bound stream only
        }
        return streams.get(streamId);
    }

    @GetMapping("/{streamId}/viewers")
    public List<ViewerView> viewers(@PathVariable UUID streamId) {
        return viewers.viewers(streamId);
    }

    @GetMapping("/{streamId}/ice")
    public Map<String, Object> ice(@PathVariable UUID streamId, HttpServletRequest request) {
        LivePrincipal principal = principal(request);
        return Map.of("iceServers", iceService.iceServers(principal.userId()));
    }

    @PostMapping("/{streamId}/end")
    public StreamView end(@PathVariable UUID streamId, HttpServletRequest request) {
        LivePrincipal principal = principal(request);
        return streams.end(streamId, principal.userId());
    }

    private LivePrincipal principal(HttpServletRequest request) {
        return (LivePrincipal) request.getAttribute(LiveJwtFilter.ATTR);
    }
}
