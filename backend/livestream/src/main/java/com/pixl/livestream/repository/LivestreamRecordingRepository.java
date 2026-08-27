package com.pixl.livestream.repository;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.pixl.livestream.entity.LivestreamRecordingEntity;

public interface LivestreamRecordingRepository extends JpaRepository<LivestreamRecordingEntity, UUID> {

    List<LivestreamRecordingEntity> findByStreamId(UUID streamId);
}
