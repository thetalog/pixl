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
@Document(collection = "livestream_chat_message")
@CompoundIndex(name = "idx_chat_stream_created", def = "{'streamId': 1, 'createdAt': 1}")
public class LivestreamChatMessageEntity {

    @Id
    private UUID id;

    private UUID streamId;

    private String userId;

    private String username;

    private String avatarUrl;

    private String body;

    private boolean deleted;

    private String deletedBy;

    private Instant createdAt;
}
