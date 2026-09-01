package com.pixl.livestream.entity;

import java.time.Instant;
import java.util.UUID;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Document(collection = "livestream_recording")
public class LivestreamRecordingEntity {

    @Id
    private UUID id;

    @Indexed
    private UUID streamId;

    private String storageBackend;

    private String objectKey;

    private String contentType;

    private Long sizeBytes;

    private String status;

    private Instant createdAt;

    private Instant completedAt;
}
