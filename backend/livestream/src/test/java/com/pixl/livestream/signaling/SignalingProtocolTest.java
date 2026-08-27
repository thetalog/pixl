package com.pixl.livestream.signaling;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

import com.fasterxml.jackson.databind.ObjectMapper;

class SignalingProtocolTest {

    private final ObjectMapper mapper = new ObjectMapper();

    @Test
    void parsesCanonicalMessage() throws Exception {
        String json = """
                {"type":"OFFER","streamId":"abc","senderId":"user-1","payload":{"sdp":"v=0"}}
                """;
        SignalingMessage message = mapper.readValue(json, SignalingMessage.class);
        assertThat(message.type()).isEqualTo(SignalingTypes.OFFER);
        assertThat(message.streamId()).isEqualTo("abc");
        assertThat(message.payload().path("sdp").asText()).isEqualTo("v=0");
    }
}
