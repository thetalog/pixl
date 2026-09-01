package com.pixl.livestream.repository;

import java.util.List;
import java.util.UUID;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.pixl.livestream.entity.LivestreamRecordingEntity;

public interface LivestreamRecordingRepository extends MongoRepository<LivestreamRecordingEntity, UUID> {

    List<LivestreamRecordingEntity> findByStreamId(UUID streamId);
}
