package com.pixl.livestream.viewer;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Instant;

import org.junit.jupiter.api.Test;

class InMemoryPresenceStoreTest {

    @Test
    void countsAndExpiresViewers() {
        InMemoryPresenceStore store = new InMemoryPresenceStore();
        store.put(new ViewerPresence("s1", "u1", "alice", "c1", Instant.now(), Instant.now().minusSeconds(120)));
        store.put(new ViewerPresence("s1", "u2", "bob", "c2", Instant.now(), Instant.now()));
        assertThat(store.count("s1")).isEqualTo(2);
        assertThat(store.expired("s1", java.time.Duration.ofSeconds(60))).hasSize(1);
        store.remove("s1", "c1");
        assertThat(store.count("s1")).isEqualTo(1);
    }

    @Test
    void rateLimitsChat() {
        InMemoryPresenceStore store = new InMemoryPresenceStore();
        for (int i = 0; i < 5; i++) {
            assertThat(store.chatRateAllow("s1", "u1", 5)).isTrue();
        }
        assertThat(store.chatRateAllow("s1", "u1", 5)).isFalse();
        assertThat(store.chatRateAllow("s1", "u2", 5)).isTrue();
    }
}
