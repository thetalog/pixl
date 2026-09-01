package com.pixl.livestream.entity;

import java.time.Instant;
import java.util.UUID;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.mapping.Document;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Document(collection = "livestream_event")
@CompoundIndex(name = "idx_livestream_event_stream", def = "{'streamId': 1, 'createdAt': 1}")
public class LivestreamEventEntity {

    @Id
    private UUID id;

    private UUID streamId;

    private String eventType;

    private String actorUserId;

    private String payload;

    private Instant createdAt;
}
