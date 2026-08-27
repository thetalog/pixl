package com.pixl.livestream.websocket;

import org.springframework.boot.autoconfigure.condition.ConditionalOnBean;
import org.springframework.data.redis.connection.Message;
import org.springframework.data.redis.connection.MessageListener;
import org.springframework.data.redis.listener.PatternTopic;
import org.springframework.data.redis.listener.RedisMessageListenerContainer;
import org.springframework.stereotype.Component;

import jakarta.annotation.PostConstruct;

@Component
@ConditionalOnBean(RedisMessageListenerContainer.class)
public class RedisLiveFanout implements MessageListener {

    private final RedisMessageListenerContainer container;
    private final LiveSessionRegistry registry;

    public RedisLiveFanout(RedisMessageListenerContainer container, LiveSessionRegistry registry) {
        this.container = container;
        this.registry = registry;
    }

    @PostConstruct
    public void subscribe() {
        container.addMessageListener(this, new PatternTopic("live:events:*"));
    }

    @Override
    public void onMessage(Message message, byte[] pattern) {
        String channel = new String(message.getChannel());
        String payload = new String(message.getBody());
        String streamId = channel.substring("live:events:".length());
        registry.broadcast(streamId, payload);
    }
}
