package com.pixl.livestream.repository;

import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.pixl.livestream.entity.LivestreamEventEntity;

public interface LivestreamEventRepository extends JpaRepository<LivestreamEventEntity, UUID> {
}
