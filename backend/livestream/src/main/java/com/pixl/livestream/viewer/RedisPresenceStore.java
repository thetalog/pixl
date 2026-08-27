package com.pixl.livestream.viewer;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.TimeUnit;

import org.springframework.boot.autoconfigure.condition.ConditionalOnBean;
import org.springframework.context.annotation.Primary;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;

import com.fasterxml.jackson.databind.ObjectMapper;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@Primary
@Component
@ConditionalOnBean(StringRedisTemplate.class)
public class RedisPresenceStore implements PresenceStore {

    private final StringRedisTemplate redis;
    private final ObjectMapper mapper;
    private final InMemoryPresenceStore fallback;

    public RedisPresenceStore(StringRedisTemplate redis, ObjectMapper mapper, InMemoryPresenceStore fallback) {
        this.redis = redis;
        this.mapper = mapper;
        this.fallback = fallback;
    }

    @Override
    public void put(ViewerPresence presence) {
        try {
            redis.opsForHash().put(viewersKey(presence.streamId()), presence.connectionId(), mapper.writeValueAsString(presence));
            redis.expire(viewersKey(presence.streamId()), Duration.ofHours(6));
        } catch (Exception ex) {
            log.warn("redis put failed, using memory: {}", ex.getMessage());
            fallback.put(presence);
        }
    }

    @Override
    public void heartbeat(String streamId, String connectionId) {
        get(streamId, connectionId).ifPresent(current -> put(new ViewerPresence(
                current.streamId(), current.viewerId(), current.userName(), current.connectionId(),
                current.joinedAt(), Instant.now()
        )));
    }

    @Override
    public void remove(String streamId, String connectionId) {
        try {
            redis.opsForHash().delete(viewersKey(streamId), connectionId);
        } catch (Exception ex) {
            fallback.remove(streamId, connectionId);
        }
    }

    @Override
    public List<ViewerPresence> list(String streamId) {
        try {
            List<ViewerPresence> result = new ArrayList<>();
            for (Object value : redis.opsForHash().values(viewersKey(streamId))) {
                result.add(mapper.readValue(String.valueOf(value), ViewerPresence.class));
            }
            return result;
        } catch (Exception ex) {
            return fallback.list(streamId);
        }
    }

    @Override
    public int count(String streamId) {
        try {
            Long size = redis.opsForHash().size(viewersKey(streamId));
            return size == null ? 0 : size.intValue();
        } catch (Exception ex) {
            return fallback.count(streamId);
        }
    }

    @Override
    public Optional<ViewerPresence> get(String streamId, String connectionId) {
        try {
            Object raw = redis.opsForHash().get(viewersKey(streamId), connectionId);
            if (raw == null) {
                return Optional.empty();
            }
            return Optional.of(mapper.readValue(String.valueOf(raw), ViewerPresence.class));
        } catch (Exception ex) {
            return fallback.get(streamId, connectionId);
        }
    }

    @Override
    public List<ViewerPresence> expired(String streamId, Duration timeout) {
        Instant cutoff = Instant.now().minus(timeout);
        return list(streamId).stream().filter(v -> v.lastHeartbeat().isBefore(cutoff)).toList();
    }

    @Override
    public void publish(String channel, String payload) {
        try {
            redis.convertAndSend(channel, payload);
        } catch (Exception ex) {
            fallback.publish(channel, payload);
        }
    }

    @Override
    public void incrReaction(String streamId, String kind, long amount) {
        try {
            redis.opsForHash().increment("live:reactions:" + streamId, kind, amount);
        } catch (Exception ex) {
            fallback.incrReaction(streamId, kind, amount);
        }
    }

    @Override
    public long getReaction(String streamId, String kind) {
        try {
            Object value = redis.opsForHash().get("live:reactions:" + streamId, kind);
            return value == null ? 0 : Long.parseLong(String.valueOf(value));
        } catch (Exception ex) {
            return fallback.getReaction(streamId, kind);
        }
    }

    @Override
    public boolean chatRateAllow(String streamId, String userId, int limitPerMinute) {
        String key = "live:rl:chat:" + streamId + ":" + userId;
        try {
            Long count = redis.opsForValue().increment(key);
            if (count != null && count == 1L) {
                redis.expire(key, 60, TimeUnit.SECONDS);
            }
            return count != null && count <= limitPerMinute;
        } catch (Exception ex) {
            return fallback.chatRateAllow(streamId, userId, limitPerMinute);
        }
    }

    @Override
    public void setHostConnection(String streamId, String connectionId) {
        try {
            redis.opsForValue().set("live:host:" + streamId, connectionId, Duration.ofHours(6));
        } catch (Exception ex) {
            fallback.setHostConnection(streamId, connectionId);
        }
    }

    @Override
    public Optional<String> getHostConnection(String streamId) {
        try {
            return Optional.ofNullable(redis.opsForValue().get("live:host:" + streamId));
        } catch (Exception ex) {
            return fallback.getHostConnection(streamId);
        }
    }

    @Override
    public void markHostDisconnect(String streamId, Instant until) {
        try {
            redis.opsForValue().set("live:host-deadline:" + streamId, until.toString(), Duration.between(Instant.now(), until).plusSeconds(5));
        } catch (Exception ex) {
            fallback.markHostDisconnect(streamId, until);
        }
    }

    @Override
    public Optional<Instant> hostReconnectDeadline(String streamId) {
        try {
            String raw = redis.opsForValue().get("live:host-deadline:" + streamId);
            return raw == null ? Optional.empty() : Optional.of(Instant.parse(raw));
        } catch (Exception ex) {
            return fallback.hostReconnectDeadline(streamId);
        }
    }

    @Override
    public void clearHostDisconnect(String streamId) {
        try {
            redis.delete("live:host-deadline:" + streamId);
        } catch (Exception ex) {
            fallback.clearHostDisconnect(streamId);
        }
    }

    private String viewersKey(String streamId) {
        return "live:viewers:" + streamId;
    }
}
