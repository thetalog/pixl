package com.pixl.livestream.repository;

import java.util.UUID;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.pixl.livestream.entity.LivestreamEventEntity;

public interface LivestreamEventRepository extends MongoRepository<LivestreamEventEntity, UUID> {
}
