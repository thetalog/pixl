package com.pixl.livestream.stream;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.pixl.livestream.config.LivestreamProperties;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class InternalApiAuthTest {

    @Autowired
    MockMvc mvc;

    @Autowired
    ObjectMapper mapper;

    @Autowired
    LivestreamProperties properties;

    @Test
    void rejectsMissingInternalSecret() throws Exception {
        mvc.perform(post("/internal/v1/streams")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void healthIsPublic() throws Exception {
        mvc.perform(get("/health")).andExpect(status().isOk());
    }

    @Test
    void createJoinWithSecret() throws Exception {
        String pixlId = "mongo" + System.nanoTime();
        String body = """
                {
                  "pixlStreamId": "%s",
                  "hostUserId": "u1",
                  "hostUsername": "alice",
                  "hostDisplayName": "Alice",
                  "title": "Hello"
                }
                """.formatted(pixlId);
        String created = mvc.perform(post("/internal/v1/streams")
                        .header("X-Internal-Secret", properties.getInternalSecret())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isCreated())
                .andReturn()
                .getResponse()
                .getContentAsString();
        JsonNode json = mapper.readTree(created);
        assertThat(json.path("stream").path("title").asText()).isEqualTo("Hello");
        String streamId = json.path("stream").path("streamId").asText();

        mvc.perform(post("/internal/v1/streams/" + streamId + "/join")
                        .header("X-Internal-Secret", properties.getInternalSecret())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"userId":"v1","userName":"bob"}
                                """))
                .andExpect(status().isOk());
    }
}
