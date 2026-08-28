package com.pixl.livestream.stream;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import com.pixl.livestream.common.ApiException;
import com.pixl.livestream.dto.StreamDtos.CreateStreamRequest;
import com.pixl.livestream.dto.StreamDtos.CreateStreamResponse;

@SpringBootTest
@ActiveProfiles("test")
class StreamLifecycleTest {

    @Autowired
    StreamService streams;

    @Test
    void createStartEndLifecycle() {
        CreateStreamResponse created = streams.create(new CreateStreamRequest(
                "pixl-" + System.nanoTime(),
                "host-1",
                "deepraj",
                "Deepraj",
                null,
                "Late night hang",
                "PUBLIC",
                false
        ));
        assertThat(created.stream().status()).isEqualTo("CREATED");
        assertThat(created.session().token()).isNotBlank();
        assertThat(created.session().iceServers()).isNotEmpty();

        var started = streams.start(java.util.UUID.fromString(created.stream().streamId()), "host-1");
        assertThat(started.status()).isEqualTo("STARTING");

        var live = streams.markLive(java.util.UUID.fromString(created.stream().streamId()), 42L);
        assertThat(live.status()).isEqualTo("LIVE");
        assertThat(live.startedAt()).isNotBlank();

        var ended = streams.end(java.util.UUID.fromString(created.stream().streamId()), "host-1");
        assertThat(ended.status()).isEqualTo("ENDED");
        assertThat(ended.endedAt()).isNotBlank();
    }

    @Test
    void strangerCannotEndStream() {
        CreateStreamResponse created = streams.create(new CreateStreamRequest(
                "pixl-" + System.nanoTime(),
                "host-2",
                "host",
                "Host",
                null,
                "Mine",
                "PUBLIC",
                false
        ));
        assertThatThrownBy(() -> streams.end(java.util.UUID.fromString(created.stream().streamId()), "intruder"))
                .isInstanceOf(ApiException.class)
                .hasMessageContaining("host");
    }

    @Test
    void hostCreateWhileActiveResumesExistingStream() {
        CreateStreamResponse first = streams.create(new CreateStreamRequest(
                "pixl-" + System.nanoTime(),
                "host-3",
                "host",
                "Host",
                null,
                "One",
                "PUBLIC",
                false
        ));
        CreateStreamResponse second = streams.create(new CreateStreamRequest(
                "pixl-" + System.nanoTime(),
                "host-3",
                "host",
                "Host",
                null,
                "Two",
                "PUBLIC",
                false
        ));
        assertThat(second.stream().streamId()).isEqualTo(first.stream().streamId());
        assertThat(second.stream().title()).isEqualTo("Two");
        assertThat(second.session().token()).isNotBlank();
    }
}
