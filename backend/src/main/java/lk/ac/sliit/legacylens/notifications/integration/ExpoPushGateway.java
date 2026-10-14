package lk.ac.sliit.legacylens.notifications.integration;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import lk.ac.sliit.legacylens.notifications.service.PushGateway;
import lk.ac.sliit.legacylens.notifications.service.PushMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.function.Consumer;

/**
 * Sends notifications through Expo's push service, which hands them on to Google (Android) or
 * Apple (iPhone). The request is made in the background and every failure is only logged.
 */
@Component
public class ExpoPushGateway implements PushGateway {

    private static final Logger log = LoggerFactory.getLogger(ExpoPushGateway.class);
    private static final Duration TIMEOUT = Duration.ofSeconds(5);
    private static final String DEAD_TOKEN_ERROR = "DeviceNotRegistered";

    private final HttpClient httpClient = HttpClient.newBuilder().connectTimeout(TIMEOUT).build();
    private final ObjectMapper mapper;
    private final String url;

    public ExpoPushGateway(
            ObjectMapper mapper,
            @Value("${app.push.expo-url:https://exp.host/--/api/v2/push/send}") String url) {
        this.mapper = mapper;
        this.url = url;
    }

    @Override
    public void send(Collection<String> tokens, PushMessage message, Consumer<String> onDeadToken) {
        List<String> targets = List.copyOf(tokens);
        try {
            HttpRequest request = HttpRequest.newBuilder(URI.create(url))
                    .timeout(TIMEOUT)
                    .header("Content-Type", "application/json")
                    .header("Accept", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(buildPayload(mapper, targets, message)))
                    .build();

            httpClient.sendAsync(request, HttpResponse.BodyHandlers.ofString())
                    .thenAccept(response -> handle(response, targets, onDeadToken))
                    .exceptionally(error -> {
                        log.warn("Could not reach the push service: {}", error.toString());
                        return null;
                    });
        } catch (RuntimeException e) {
            log.warn("Could not send a push notification", e);
        }
    }

    private void handle(HttpResponse<String> response, List<String> targets, Consumer<String> onDeadToken) {
        if (response.statusCode() / 100 != 2) {
            log.warn("The push service answered {}: {}", response.statusCode(), response.body());
            return;
        }
        for (String dead : deadTokens(mapper, targets, response.body())) {
            try {
                onDeadToken.accept(dead);
            } catch (RuntimeException e) {
                log.warn("Could not forget a dead push token", e);
            }
        }
    }

    /** The JSON the push service expects: one entry per phone. */
    public static String buildPayload(ObjectMapper mapper, List<String> tokens, PushMessage message) {
        ArrayNode messages = mapper.createArrayNode();
        for (String token : tokens) {
            ObjectNode entry = messages.addObject();
            entry.put("to", token);
            entry.put("title", message.title());
            entry.put("body", message.body());
            entry.put("sound", "default");
            entry.put("channelId", "default");
            ObjectNode data = entry.putObject("data");
            message.data().forEach(data::put);
        }
        try {
            return mapper.writeValueAsString(messages);
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("Could not build the push payload", e);
        }
    }

    /**
     * Which of the tokens the push service says are no longer valid. Answers come back in the same
     * order the tokens were sent in; anything unreadable is treated as "nothing to forget".
     */
    public static List<String> deadTokens(ObjectMapper mapper, List<String> tokens, String responseBody) {
        List<String> dead = new ArrayList<>();
        try {
            JsonNode data = mapper.readTree(responseBody).path("data");
            for (int i = 0; i < data.size() && i < tokens.size(); i++) {
                JsonNode result = data.get(i);
                if ("error".equals(result.path("status").asText())
                        && DEAD_TOKEN_ERROR.equals(result.path("details").path("error").asText())) {
                    dead.add(tokens.get(i));
                }
            }
        } catch (JsonProcessingException | RuntimeException e) {
            log.warn("Could not read the push service's answer", e);
        }
        return dead;
    }
}
