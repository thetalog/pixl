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
@Document(collection = "livestream_moderator")
@CompoundIndex(name = "stream_user_unique", def = "{'streamId': 1, 'userId': 1}", unique = true)
public class LivestreamModeratorEntity {

    @Id
    private UUID id;

    private UUID streamId;

    private String userId;

    private String grantedBy;

    private Instant createdAt;
}
