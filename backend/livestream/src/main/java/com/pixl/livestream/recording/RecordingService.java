package com.pixl.livestream.recording;

import java.time.Instant;
import java.util.UUID;

import org.springframework.stereotype.Service;

import com.pixl.livestream.config.LivestreamProperties;
import com.pixl.livestream.entity.LivestreamRecordingEntity;
import com.pixl.livestream.repository.LivestreamRecordingRepository;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
public class RecordingService {

    private final LivestreamRecordingRepository recordings;
    private final LivestreamProperties properties;
    private final ObjectStorage storage;

    public RecordingService(
            LivestreamRecordingRepository recordings,
            LivestreamProperties properties,
            ObjectStorage storage
    ) {
        this.recordings = recordings;
        this.properties = properties;
        this.storage = storage;
    }

    public LivestreamRecordingEntity start(UUID streamId) {
        LivestreamRecordingEntity entity = new LivestreamRecordingEntity();
        entity.setId(UUID.randomUUID());
        entity.setStreamId(streamId);
        entity.setStorageBackend(properties.getRecording().getStorage());
        entity.setObjectKey(storage.keyFor(streamId));
        entity.setContentType("video/webm");
        entity.setStatus("RECORDING");
        entity.setCreatedAt(Instant.now());
        recordings.save(entity);
        log.info("recording started streamId={} backend={} key={}", streamId, entity.getStorageBackend(), entity.getObjectKey());
        return entity;
    }

    public void complete(UUID streamId) {
        recordings.findByStreamId(streamId).forEach(entity -> {
            if ("RECORDING".equals(entity.getStatus())) {
                entity.setStatus("AVAILABLE");
                entity.setCompletedAt(Instant.now());
                recordings.save(entity);
                log.info("recording completed streamId={} key={}", streamId, entity.getObjectKey());
            }
        });
    }
}
