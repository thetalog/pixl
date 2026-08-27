package com.pixl.livestream.entity;

import java.time.Instant;
import java.util.UUID;

import com.pixl.livestream.stream.StreamStatus;
import com.pixl.livestream.stream.StreamVisibility;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "livestream")
public class LivestreamEntity {

    @Id
    private UUID id;

    @Column(name = "pixl_stream_id", nullable = false, unique = true)
    private String pixlStreamId;

    @Column(name = "host_user_id", nullable = false)
    private String hostUserId;

    @Column(name = "host_username", nullable = false)
    private String hostUsername;

    @Column(name = "host_display_name")
    private String hostDisplayName;

    @Column(name = "host_avatar_url")
    private String hostAvatarUrl;

    @Column(nullable = false)
    private String title;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private StreamStatus status;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private StreamVisibility visibility;

    @Column(name = "recording_enabled", nullable = false)
    private boolean recordingEnabled;

    @Column(name = "janus_room_id")
    private Long janusRoomId;

    @Column(name = "publisher_feed_id")
    private Long publisherFeedId;

    @Column(name = "like_count", nullable = false)
    private long likeCount;

    @Column(name = "reaction_count", nullable = false)
    private long reactionCount;

    @Column(name = "peak_viewer_count", nullable = false)
    private int peakViewerCount;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "started_at")
    private Instant startedAt;

    @Column(name = "ended_at")
    private Instant endedAt;

    @Column(name = "failure_reason")
    private String failureReason;
}
