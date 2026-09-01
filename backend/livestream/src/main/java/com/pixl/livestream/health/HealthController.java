package com.pixl.livestream.health;

import java.util.LinkedHashMap;
import java.util.Map;

import org.bson.Document;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import com.pixl.livestream.media.MediaRouter;

@RestController
public class HealthController {

    private final MongoTemplate mongoTemplate;
    private final ObjectProvider<StringRedisTemplate> redis;
    private final MediaRouter mediaRouter;

    public HealthController(
            MongoTemplate mongoTemplate,
            ObjectProvider<StringRedisTemplate> redis,
            MediaRouter mediaRouter
    ) {
        this.mongoTemplate = mongoTemplate;
        this.redis = redis;
        this.mediaRouter = mediaRouter;
    }

    @GetMapping("/health")
    public Map<String, Object> health() {
        return Map.of("status", "ok", "service", "pixl-livestream");
    }

    @GetMapping("/ready")
    public ResponseEntity<Map<String, Object>> ready() {
        Map<String, Object> checks = new LinkedHashMap<>();
        boolean db = pingDb();
        boolean cache = pingRedis();
        boolean media = mediaRouter.isAvailable();
        checks.put("database", db ? "ok" : "down");
        checks.put("redis", cache ? "ok" : "down");
        checks.put("media", media ? "ok" : "down");
        boolean ready = db;
        checks.put("status", ready ? "ok" : "degraded");
        return ResponseEntity.status(ready ? 200 : 503).body(checks);
    }

    private boolean pingDb() {
        try {
            mongoTemplate.getDb().runCommand(new Document("ping", 1));
            return true;
        } catch (Exception ex) {
            return false;
        }
    }

    private boolean pingRedis() {
        StringRedisTemplate template = redis.getIfAvailable();
        if (template == null) {
            return true;
        }
        try {
            template.hasKey("live:health");
            return true;
        } catch (Exception ex) {
            return false;
        }
    }
}
