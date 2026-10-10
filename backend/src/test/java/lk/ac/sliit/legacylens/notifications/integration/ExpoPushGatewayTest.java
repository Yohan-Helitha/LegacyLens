package lk.ac.sliit.legacylens.notifications.integration;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lk.ac.sliit.legacylens.notifications.service.PushMessage;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

class ExpoPushGatewayTest {

    private final ObjectMapper mapper = new ObjectMapper();

    @Test
    void payload_hasOneEntryPerPhone_withTheMessageAndItsData() throws Exception {
        PushMessage message = new PushMessage("Application update", "Not accepted this time", Map.of("type", "application-rejected"));

        String json = ExpoPushGateway.buildPayload(mapper, List.of("ExponentPushToken[a]", "ExponentPushToken[b]"), message);

        JsonNode payload = mapper.readTree(json);
        assertThat(payload.isArray()).isTrue();
        assertThat(payload).hasSize(2);
        assertThat(payload.get(0).path("to").asText()).isEqualTo("ExponentPushToken[a]");
        assertThat(payload.get(1).path("to").asText()).isEqualTo("ExponentPushToken[b]");
        assertThat(payload.get(0).path("title").asText()).isEqualTo("Application update");
        assertThat(payload.get(0).path("body").asText()).isEqualTo("Not accepted this time");
        assertThat(payload.get(0).path("data").path("type").asText()).isEqualTo("application-rejected");
        assertThat(payload.get(0).path("channelId").asText()).isEqualTo("default");
    }

    @Test
    void deadTokens_areTheOnesThePushServiceSaysAreNotRegistered() {
        List<String> tokens = List.of("ExponentPushToken[a]", "ExponentPushToken[b]", "ExponentPushToken[c]");
        String answer = """
                {"data":[
                  {"status":"ok","id":"1"},
                  {"status":"error","message":"gone","details":{"error":"DeviceNotRegistered"}},
                  {"status":"error","message":"too big","details":{"error":"MessageTooBig"}}
                ]}""";

        assertThat(ExpoPushGateway.deadTokens(mapper, tokens, answer)).containsExactly("ExponentPushToken[b]");
    }

    @Test
    void anUnreadableAnswer_forgetsNothing() {
        assertThat(ExpoPushGateway.deadTokens(mapper, List.of("ExponentPushToken[a]"), "not json")).isEmpty();
        assertThat(ExpoPushGateway.deadTokens(mapper, List.of("ExponentPushToken[a]"), "{}")).isEmpty();
    }
}
