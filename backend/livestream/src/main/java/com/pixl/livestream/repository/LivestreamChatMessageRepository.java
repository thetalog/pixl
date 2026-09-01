package com.pixl.livestream.repository;

import java.util.List;
import java.util.UUID;

import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;

import com.pixl.livestream.entity.LivestreamChatMessageEntity;

public interface LivestreamChatMessageRepository extends MongoRepository<LivestreamChatMessageEntity, UUID> {

    List<LivestreamChatMessageEntity> findByStreamIdAndDeletedFalseOrderByCreatedAtAsc(UUID streamId, Pageable pageable);
}
