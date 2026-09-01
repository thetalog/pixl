package com.pixl.livestream.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.pixl.livestream.entity.LivestreamEntity;
import com.pixl.livestream.stream.StreamStatus;

public interface LivestreamRepository extends MongoRepository<LivestreamEntity, UUID> {

    Optional<LivestreamEntity> findByPixlStreamId(String pixlStreamId);

    List<LivestreamEntity> findByStatusOrderByStartedAtDesc(StreamStatus status);

    List<LivestreamEntity> findByStatusInOrderByCreatedAtDesc(List<StreamStatus> statuses);

    List<LivestreamEntity> findByHostUserIdAndStatusIn(String hostUserId, List<StreamStatus> statuses);
}
