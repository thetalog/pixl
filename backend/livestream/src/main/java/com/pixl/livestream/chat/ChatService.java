package com.pixl.livestream.chat;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import com.pixl.livestream.common.ApiException;
import com.pixl.livestream.config.LivestreamProperties;
import com.pixl.livestream.entity.LivestreamChatMessageEntity;
import com.pixl.livestream.integration.NodeCallbackClient;
import com.pixl.livestream.repository.LivestreamChatMessageRepository;
import com.pixl.livestream.security.LivePermission;
import com.pixl.livestream.security.LivePrincipal;
import com.pixl.livestream.stream.StreamService;
import com.pixl.livestream.viewer.PresenceStore;

@Service
public class ChatService {

    private final LivestreamChatMessageRepository messages;
    private final LivestreamProperties properties;
    private final PresenceStore presence;
    private final NodeCallbackClient node;
    private final StreamService streams;

    public ChatService(
            LivestreamChatMessageRepository messages,
            LivestreamProperties properties,
            PresenceStore presence,
            NodeCallbackClient node,
            StreamService streams
    ) {
        this.messages = messages;
        this.properties = properties;
        this.presence = presence;
        this.node = node;
        this.streams = streams;
    }

    public LivestreamChatMessageEntity send(LivePrincipal principal, String body) {
        streams.assertPermission(principal, LivePermission.COMMENT);
        String text = body == null ? "" : body.trim();
        if (text.isEmpty()) {
            throw ApiException.badRequest("Message is empty");
        }
        if (text.length() > properties.getChat().getMaxLength()) {
            throw ApiException.badRequest("Message too long");
        }
        UUID streamId = UUID.fromString(principal.streamId());
        if (!presence.chatRateAllow(principal.streamId(), principal.userId(), properties.getChat().getRatePerMinute())) {
            throw ApiException.tooMany("Slow down");
        }
        LivestreamChatMessageEntity entity = new LivestreamChatMessageEntity();
        entity.setId(UUID.randomUUID());
        entity.setStreamId(streamId);
        entity.setUserId(principal.userId());
        entity.setUsername(principal.userName());
        entity.setAvatarUrl(principal.avatarUrl());
        entity.setBody(text);
        entity.setDeleted(false);
        entity.setCreatedAt(Instant.now());
        messages.save(entity);
        node.notifyComment(principal.pixlStreamId(), Map.of(
                "id", entity.getId().toString(),
                "userId", entity.getUserId(),
                "userName", entity.getUsername(),
                "profilePic", entity.getAvatarUrl() == null ? "" : entity.getAvatarUrl(),
                "text", entity.getBody(),
                "createdAt", entity.getCreatedAt().toString()
        ));
        return entity;
    }

    public LivestreamChatMessageEntity delete(LivePrincipal principal, UUID messageId) {
        streams.assertPermission(principal, LivePermission.DELETE_COMMENT);
        LivestreamChatMessageEntity entity = messages.findById(messageId)
                .orElseThrow(() -> ApiException.notFound("Comment not found"));
        if (!entity.getStreamId().toString().equals(principal.streamId())) {
            throw ApiException.forbidden("Comment is not in this stream");
        }
        entity.setDeleted(true);
        entity.setDeletedBy(principal.userId());
        return messages.save(entity);
    }

    public List<LivestreamChatMessageEntity> recent(UUID streamId) {
        return messages.findByStreamIdAndDeletedFalseOrderByCreatedAtAsc(streamId, PageRequest.of(0, 200));
    }
}
