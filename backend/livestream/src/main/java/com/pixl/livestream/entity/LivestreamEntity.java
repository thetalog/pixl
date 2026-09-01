package com.pixl.livestream.entity;

import java.time.Instant;
import java.util.UUID;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import com.pixl.livestream.stream.StreamStatus;
import com.pixl.livestream.stream.StreamVisibility;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Document(collection = "livestream")
public class LivestreamEntity {

    @Id
    private UUID id;

    @Indexed(unique = true)
    private String pixlStreamId;

    @Indexed
    private String hostUserId;

    private String hostUsername;

    private String hostDisplayName;

    private String hostAvatarUrl;

    private String title;

    @Indexed
    private StreamStatus status;

    private StreamVisibility visibility;

    private boolean recordingEnabled;

    private Long janusRoomId;

    private Long publisherFeedId;

    private long likeCount;

    private long reactionCount;

    private int peakViewerCount;

    private Instant createdAt;

    private Instant startedAt;

    private Instant endedAt;

    private String failureReason;
}
