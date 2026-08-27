package com.pixl.livestream.stream;

import java.time.Instant;
import java.util.UUID;

import org.springframework.stereotype.Component;

import com.pixl.livestream.entity.LivestreamEventEntity;
import com.pixl.livestream.repository.LivestreamEventRepository;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
public class StreamEventLogger {

    private final LivestreamEventRepository events;

    public StreamEventLogger(LivestreamEventRepository events) {
        this.events = events;
    }

    public void log(UUID streamId, String type, String actorUserId, String payload) {
        LivestreamEventEntity entity = new LivestreamEventEntity();
        entity.setId(UUID.randomUUID());
        entity.setStreamId(streamId);
        entity.setEventType(type);
        entity.setActorUserId(actorUserId);
        entity.setPayload(payload);
        entity.setCreatedAt(Instant.now());
        events.save(entity);
        log.info("stream_event type={} streamId={} actor={}", type, streamId, actorUserId);
    }
}
