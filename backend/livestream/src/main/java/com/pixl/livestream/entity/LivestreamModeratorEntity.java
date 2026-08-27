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
@Table(name = "livestream_moderator")
public class LivestreamModeratorEntity {

    @Id
    private UUID id;

    @Column(name = "stream_id", nullable = false)
    private UUID streamId;

    @Column(name = "user_id", nullable = false)
    private String userId;

    @Column(name = "granted_by", nullable = false)
    private String grantedBy;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;
}
