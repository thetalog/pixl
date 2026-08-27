package com.pixl.livestream.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.pixl.livestream.entity.LivestreamModeratorEntity;

public interface LivestreamModeratorRepository extends JpaRepository<LivestreamModeratorEntity, UUID> {

    Optional<LivestreamModeratorEntity> findByStreamIdAndUserId(UUID streamId, String userId);

    List<LivestreamModeratorEntity> findByStreamId(UUID streamId);
}
