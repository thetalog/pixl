package com.pixl.livestream.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.pixl.livestream.entity.LivestreamModeratorEntity;

public interface LivestreamModeratorRepository extends MongoRepository<LivestreamModeratorEntity, UUID> {

    Optional<LivestreamModeratorEntity> findByStreamIdAndUserId(UUID streamId, String userId);

    List<LivestreamModeratorEntity> findByStreamId(UUID streamId);
}
