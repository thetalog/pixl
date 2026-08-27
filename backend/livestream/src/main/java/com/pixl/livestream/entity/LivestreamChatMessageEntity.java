package com.pixl.livestream.entity;

import java.time.Instant;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "livestream_chat_message")
public class LivestreamChatMessageEntity {

    @Id
    private UUID id;

    @Column(name = "stream_id", nullable = false)
    private UUID streamId;

    @Column(name = "user_id", nullable = false)
    private String userId;

    @Column(nullable = false)
    private String username;

    @Column(name = "avatar_url")
    private String avatarUrl;

    @Column(nullable = false, length = 500)
    private String body;

    @Column(nullable = false)
    private boolean deleted;

    @Column(name = "deleted_by")
    private String deletedBy;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;
}
